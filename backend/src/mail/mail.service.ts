import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    private async send(to: string, subject: string, html: string, text: string) {
        if (process.env.MAIL_DRIVER === 'console') {
            this.logger.log(`[MAIL ke ${to}] ${subject}\n${text}`);
            return;
        }

        const res = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'api-key': process.env.BREVO_API_KEY ?? '',
                'content-type': 'application/json',
                accept: 'application/json',
            },
            body: JSON.stringify({
                sender: {
                    email: process.env.MAIL_FROM,
                    name: 'Guyub Ngapak',
                },
                to: [{ email: to }],
                subject,
                htmlContent: html,
                textContent: text,
            }),
        });

        if (!res.ok) {
            const detail = await res.text();
            this.logger.error(`Brevo gagal: ${res.status} ${detail}`);
            throw new Error(`Gagal mengirim email: ${res.status}`);
        }
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