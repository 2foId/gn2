import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
    private readonly logger = new Logger(MailService.name);
    private readonly transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT ?? 465),
        secure: process.env.MAIL_SECURE !== 'false',
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        },
    });

    // Cek koneksi SMTP saat server start, supaya salah konfigurasi langsung terlihat.
    async onModuleInit() {
        if (process.env.MAIL_DRIVER === 'console') return;
        try {
            await this.transporter.verify();
            this.logger.log('SMTP Gmail siap');
        } catch (err) {
            this.logger.error('SMTP gagal terhubung. Cek MAIL_USER dan MAIL_PASS.', err);
        }
    }

    private async send(to: string, subject: string, html: string, text: string) {
        if (process.env.MAIL_DRIVER === 'console') {
            this.logger.log(`[MAIL ke ${to}] ${subject}\n${text}`);
            return;
        }
        await this.transporter.sendMail({
            from: process.env.MAIL_FROM,
            to,
            subject,
            html,
            text,
        });
    }

    sendVerification(to: string, token: string) {
        const link = `${process.env.APP_URL}/verify-email?token=${token}`;
        return this.send(
            to,
            'Verifikasi email Guyub Ngapak',
            `<p>Klik tautan berikut untuk mengaktifkan akun kamu:</p>
       <p><a href="${link}">${link}</a></p>
       <p>Tautan ini berlaku 24 jam.</p>`,
            `Verifikasi akun kamu: ${link} (berlaku 24 jam)`,
        );
    }

    sendResetPassword(to: string, token: string) {
        const link = `${process.env.APP_URL}/reset-password?token=${token}`;
        return this.send(
            to,
            'Reset password Guyub Ngapak',
            `<p>Klik tautan berikut untuk membuat password baru:</p>
       <p><a href="${link}">${link}</a></p>
       <p>Tautan ini berlaku 1 jam. Abaikan email ini jika kamu tidak meminta reset.</p>`,
            `Reset password: ${link} (berlaku 1 jam)`,
        );
    }
}