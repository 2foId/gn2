import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsappProvider } from '../whatsapp-provider.interface';

// ============================================================================
// Fonnte (fonnte.com) — populer di Indonesia, setup cepat (scan QR di HP),
// tanpa proses approval template. COCOK UNTUK DEVELOPMENT/MVP CEPAT.
//
// PERINGATAN: Fonnte bukan partner resmi Meta — ia bekerja lewat automasi
// WhatsApp Web, yang secara teknis melanggar ToS WhatsApp. Nomor bisa
// diblokir Meta sewaktu-waktu tanpa pemberitahuan. Untuk aplikasi warga
// jangka panjang dan skala besar, migrasi ke Meta Cloud API (resmi) lebih
// aman untuk production.
//
// PRASYARAT:
// 1. Daftar di fonnte.com, hubungkan nomor WA lewat scan QR
// 2. Salin "Token Device" dari dashboard, isi ke .env (FONNTE_TOKEN)
// ============================================================================

@Injectable()
export class FonnteWhatsappProvider implements WhatsappProvider {
  private readonly logger = new Logger(FonnteWhatsappProvider.name);
  private readonly token: string;

  constructor(private config: ConfigService) {
    this.token = this.config.get<string>('FONNTE_TOKEN') ?? '';
  }

  private formatNomor(nomorHp: string): string {
    let nomor = nomorHp.replace(/\D/g, '');
    if (nomor.startsWith('0')) nomor = '62' + nomor.slice(1);
    if (!nomor.startsWith('62')) nomor = '62' + nomor;
    return nomor;
  }

  async sendOtp(nomorHp: string, code: string): Promise<void> {
    const target = this.formatNomor(nomorHp);
    const message = `Kode OTP Guyub Ngapak Anda: *${code}*\n\nJangan bagikan kode ini kepada siapa pun. Berlaku 5 menit.`;

    try {
      const res = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          Authorization: this.token,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ target, message }),
      });

      const data = await res.json();
      if (!res.ok || data.status === false) {
        this.logger.error(`Gagal kirim OTP via Fonnte ke ${target}: ${JSON.stringify(data)}`);
        throw new InternalServerErrorException('Gagal mengirim kode OTP via WhatsApp');
      }
    } catch (err) {
      this.logger.error(`Error koneksi ke Fonnte API: ${err}`);
      throw new InternalServerErrorException('Gagal mengirim kode OTP via WhatsApp');
    }
  }
}
