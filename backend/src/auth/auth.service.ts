import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { generateToken, hashToken } from './token.util';

const SALT_ROUNDS = 12;
const LOGIN_RATE_LIMIT = 5;
const LOGIN_RATE_TTL = 15 * 60 * 1000;
type LoginAttempt = { count: number; firstAttempt: number };
const loginAttempts = new Map<string, LoginAttempt>();

function getClientIp(req: Express.Request): string {
  return (req as any).ip || (req as any).connection?.remoteAddress || 'unknown';
}

function checkLoginRateLimit(ip: string): void {
  const now = Date.now();
  const attempt = loginAttempts.get(ip);
  if (!attempt) return;
  if (now - attempt.firstAttempt > LOGIN_RATE_TTL) {
    loginAttempts.delete(ip);
    return;
  }
  if (attempt.count >= LOGIN_RATE_LIMIT) {
    throw new BadRequestException('Terlalu banyak percobaan login. Coba lagi dalam 15 menit.');
  }
}

function recordLoginAttempt(ip: string): void {
  const now = Date.now();
  const attempt = loginAttempts.get(ip);
  if (!attempt || now - attempt.firstAttempt > LOGIN_RATE_TTL) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
  } else {
    attempt.count += 1;
  }
}

function clearLoginAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private mailService: MailService,
  ) { }

  // ---------- REGISTRASI ----------
  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email sudah terdaftar');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.usersService.create({
      nama: dto.nama,
      email: dto.email,
      passwordHash,
      dusun: dto.dusun,
      rt: dto.rt,
      rw: dto.rw,
    });

    // Buat token verifikasi email (24 jam)
    const { raw, hash } = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.prisma.emailToken.create({
      data: {
        userId: user.id,
        tokenHash: hash,
        purpose: 'VERIFY_EMAIL',
        expiresAt,
      },
    });

    await this.mailService.sendVerification(dto.email, raw);

    return {
      message: 'Registrasi berhasil. Cek email kamu untuk verifikasi.',
      userId: user.id,
    };
  }

  // ---------- VERIFIKASI EMAIL ----------
  async resendVerification(dto: ForgotPasswordDto) {
    const message = 'Jika email belum terverifikasi, tautan verifikasi telah dikirim.';
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || user.emailVerifiedAt) {
      return { message };
    }

    const { raw, hash } = generateToken();
    await this.prisma.emailToken.create({
      data: {
        userId: user.id,
        tokenHash: hash,
        purpose: 'VERIFY_EMAIL',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    await this.mailService.sendVerification(user.email, raw);
    return { message };
  }

  async verifyEmail(token: string) {
    if (!token?.trim()) {
      throw new BadRequestException('Token tidak ditemukan.');
    }

    const tokenHash = hashToken(token);
    const result = await this.prisma.$transaction(async (tx) => {
      const emailToken = await tx.emailToken.findUnique({
        where: { tokenHash },
        include: { user: true },
      });

      if (!emailToken || emailToken.purpose !== 'VERIFY_EMAIL') {
        throw new BadRequestException('Token verifikasi tidak valid.');
      }

      if (emailToken.user.emailVerifiedAt) {
        return {
          status: 'ALREADY_VERIFIED',
          userId: emailToken.userId,
        };
      }

      if (emailToken.expiresAt <= new Date()) {
        throw new BadRequestException('Token verifikasi sudah kedaluwarsa.');
      }
      if (emailToken.usedAt) {
        throw new BadRequestException('Token verifikasi sudah digunakan. Minta tautan baru.');
      }

      const now = new Date();
      const claimed = await tx.emailToken.updateMany({
        where: {
          id: emailToken.id,
          purpose: 'VERIFY_EMAIL',
          usedAt: null,
          expiresAt: { gt: now },
        },
        data: { usedAt: now },
      });

      if (claimed.count !== 1) {
        const currentToken = await tx.emailToken.findUnique({
          where: { id: emailToken.id },
          include: { user: true },
        });
        if (currentToken?.user.emailVerifiedAt) {
          return {
            status: 'ALREADY_VERIFIED',
            userId: currentToken.userId,
          };
        }
        if (currentToken && currentToken.expiresAt <= new Date()) {
          throw new BadRequestException('Token verifikasi sudah kedaluwarsa.');
        }
        throw new BadRequestException('Token verifikasi sudah digunakan. Minta tautan baru.');
      }

      await tx.user.update({
        where: { id: emailToken.userId },
        data: { emailVerifiedAt: now },
      });

      return {
        status: 'VERIFIED',
        userId: emailToken.userId,
      };
    });

    const user = await this.usersService.findById(result.userId);
    if (!user) throw new BadRequestException('Akun verifikasi tidak ditemukan.');
    const tokens = await this.issueTokens(user.id, user.email, user.role);
    return {
      status: result.status,
      message: 'Email kamu sudah terverifikasi. Silakan masuk.',
      onboardingDone: user.onboardingDone,
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role,
        onboardingDone: user.onboardingDone,
        dusun: user.dusun,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        themePreference: user.themePreference,
        kontak: user.kontak,
      },
      ...tokens,
    };
  }

  // ---------- LOGIN ----------
  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Email atau password salah');

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Email atau password salah');

    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException('Silakan verifikasi email terlebih dahulu.');
    }

    return user;
  }

  async login(dto: LoginDto, ip?: string) {
    if (ip) {
      checkLoginRateLimit(ip);
    }
    try {
      const user = await this.validateUser(dto.email, dto.password);
      if (ip) clearLoginAttempts(ip);
      const tokens = await this.issueTokens(user.id, user.email, user.role);
      return {
        user: {
          id: user.id,
          nama: user.nama,
          email: user.email,
          role: user.role,
          onboardingDone: user.onboardingDone,
          dusun: user.dusun,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          themePreference: user.themePreference,
          kontak: user.kontak,
        },
        ...tokens,
      };
    } catch (err) {
      if (ip) recordLoginAttempt(ip);
      throw err;
    }
  }

  // ---------- FORGOT PASSWORD ----------
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      // Respons generik: tidak membangkitkan apakah email terdaftar atau tidak
      return { message: 'Jika email terdaftar, tautan reset password telah dikirim.' };
    }

    const { raw, hash } = generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 jam
    await this.prisma.emailToken.create({
      data: {
        userId: user.id,
        tokenHash: hash,
        purpose: 'RESET_PASSWORD',
        expiresAt,
      },
    });

    await this.mailService.sendResetPassword(user.email, raw);

    return { message: 'Jika email terdaftar, tautan reset password telah dikirim.' };
  }

  // ---------- RESET PASSWORD ----------
  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = hashToken(dto.token);
    const emailToken = await this.prisma.emailToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!emailToken) {
      throw new BadRequestException('Token reset password tidak valid.');
    }
    if (emailToken.purpose !== 'RESET_PASSWORD') {
      throw new BadRequestException('Token reset password tidak valid.');
    }
    if (emailToken.usedAt) {
      throw new BadRequestException('Token reset password sudah digunakan.');
    }
    if (emailToken.expiresAt < new Date()) {
      throw new BadRequestException('Token reset password sudah kedaluwarsa.');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    await this.prisma.user.update({
      where: { id: emailToken.userId },
      data: { passwordHash },
    });

    await this.prisma.emailToken.update({
      where: { id: emailToken.id },
      data: { usedAt: new Date() },
    });

    return { message: 'Password berhasil diubah. Silakan login.' };
  }

  // ---------- TOKEN ----------
  private async issueTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN') ?? '15m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN') ?? '7d',
    });

    const tokenHash = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    return { accessToken, refreshToken };
  }

  async refresh(userId: string, oldRefreshToken: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException();

    const storedTokens = await this.prisma.refreshToken.findMany({
      where: { userId, revoked: false, expiresAt: { gt: new Date() } },
    });

    let matched: (typeof storedTokens)[number] | null = null;
    for (const stored of storedTokens) {
      if (await bcrypt.compare(oldRefreshToken, stored.tokenHash)) {
        matched = stored;
        break;
      }
    }

    if (!matched) {
      throw new UnauthorizedException('Sesi tidak valid, silakan login ulang');
    }

    await this.prisma.refreshToken.update({
      where: { id: matched.id },
      data: { revoked: true },
    });

    const tokens = await this.issueTokens(user.id, user.email, user.role);
    return {
      user: { id: user.id, nama: user.nama, email: user.email, role: user.role, onboardingDone: user.onboardingDone, avatarUrl: user.avatarUrl, bio: user.bio, themePreference: user.themePreference, kontak: user.kontak },
      ...tokens,
    };
  }

  // ---------- LOGOUT ----------
  async logout(userId: string, refreshToken?: string) {
    if (!refreshToken) {
      return { message: 'Logout berhasil' };
    }

    const storedTokens = await this.prisma.refreshToken.findMany({
      where: { userId, revoked: false },
    });

    for (const stored of storedTokens) {
      if (await bcrypt.compare(refreshToken, stored.tokenHash)) {
        await this.prisma.refreshToken.update({
          where: { id: stored.id },
          data: { revoked: true },
        });
        break;
      }
    }

    return { message: 'Logout berhasil' };
  }
}
