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
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { WHATSAPP_PROVIDER, WhatsappProvider } from '../whatsapp/whatsapp-provider.interface';

const SALT_ROUNDS = 12;
const LOGIN_RATE_LIMIT = 10;
const LOGIN_RATE_TTL = 5 * 60 * 1000;
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
    throw new BadRequestException('Terlalu banyak percobaan login. Coba lagi dalam 5 menit.');
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
    @Inject(WHATSAPP_PROVIDER) private whatsappProvider: WhatsappProvider,
  ) { }

  // ---------- REGISTRASI ----------
  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByKontak(dto.kontak);
    if (existing) {
      throw new ConflictException('Nomor HP sudah terdaftar');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.usersService.create({
      nama: dto.nama,
      kontak: dto.kontak,
      passwordHash,
      dusun: dto.dusun,
      rt: dto.rt,
      rw: dto.rw,
    });

    await this.generateAndSendOtp(user.id, user.kontak);

    return {
      message: 'Registrasi berhasil. Kode OTP telah dikirim untuk verifikasi nomor HP.',
      userId: user.id,
    };
  }

  // ---------- OTP ----------
  // Provider aktual (Meta Cloud API / Fonnte / stub) ditentukan lewat WhatsappModule,
  // berdasarkan env WHATSAPP_PROVIDER. Kode ini sudah tidak perlu tahu detail provider.
  private async generateAndSendOtp(userId: string, kontak: string) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresInMinutes = Number(this.config.get('OTP_EXPIRES_IN_MINUTES') ?? 5);

    await this.prisma.otpCode.create({
      data: {
        userId,
        code,
        expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000),
      },
    });

    await this.whatsappProvider.sendOtp(kontak, code);
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.usersService.findByKontak(dto.kontak);
    if (!user) throw new BadRequestException('Nomor HP tidak ditemukan');

    const otp = await this.prisma.otpCode.findFirst({
      where: { userId: user.id, code: dto.code, used: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp || otp.expiresAt < new Date()) {
      throw new BadRequestException('Kode OTP salah atau sudah kedaluwarsa');
    }

    await this.prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });
    await this.usersService.markKontakVerified(user.id);

    return { message: 'Nomor HP berhasil diverifikasi. Silakan login.' };
  }

  async resendOtp(kontak: string) {
    const user = await this.usersService.findByKontak(kontak);
    if (!user) throw new BadRequestException('Nomor HP tidak ditemukan');
    if (user.kontakVerified) throw new BadRequestException('Nomor HP sudah terverifikasi');

    await this.generateAndSendOtp(user.id, user.kontak);
    return { message: 'Kode OTP baru telah dikirim' };
  }

  // ---------- LOGIN ----------
  async validateUser(kontak: string, password: string) {
    const user = await this.usersService.findByKontak(kontak);
    if (!user) throw new UnauthorizedException('Nomor HP atau password salah');

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Nomor HP atau password salah');

    if (!user.kontakVerified) {
      throw new UnauthorizedException('Nomor HP belum diverifikasi. Cek kode OTP Anda.');
    }

    return user;
  }

  async login(dto: LoginDto, ip?: string) {
    if (ip) {
      checkLoginRateLimit(ip);
    }
    try {
      const user = await this.validateUser(dto.kontak, dto.password);
      if (ip) clearLoginAttempts(ip);
      const tokens = await this.issueTokens(user.id, user.kontak, user.role);
      return {
        user: {
          id: user.id,
          nama: user.nama,
          kontak: user.kontak,
          role: user.role,
          dusun: user.dusun,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
        },
        ...tokens,
      };
    } catch (err) {
      if (ip) recordLoginAttempt(ip);
      throw err;
    }
  }

  // ---------- TOKEN ----------
  private async issueTokens(userId: string, kontak: string, role: string) {
    const payload = { sub: userId, kontak, role };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN') ?? '15m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN') ?? '7d',
    });

    // Simpan hash refresh token, bukan token asli — memudahkan revoke saat logout
    // dan supaya kebocoran database tidak langsung membocorkan token aktif.
    const tokenHash = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    return { accessToken, refreshToken };
  }

  // Dipanggil dari endpoint /auth/refresh (dilindungi JwtRefreshGuard)
  async refresh(userId: string, oldRefreshToken: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException();

    // Cari refresh token aktif milik user yang cocok dengan hash-nya
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

    // Rotasi: cabut token lama, terbitkan pasangan token baru
    await this.prisma.refreshToken.update({
      where: { id: matched.id },
      data: { revoked: true },
    });

    const tokens = await this.issueTokens(user.id, user.kontak, user.role);
    return {
      user: { id: user.id, nama: user.nama, kontak: user.kontak, role: user.role, avatarUrl: user.avatarUrl, bio: user.bio },
      ...tokens,
    };
  }

  // ---------- LOGOUT ----------
  async logout(userId: string, refreshToken?: string) {
    if (!refreshToken) {
      // Tidak ada token dikirim, cukup anggap sudah logout
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
