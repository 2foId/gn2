import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsappProvider } from '../whatsapp-provider.interface';

// ============================================================================
// Meta WhatsApp Cloud API (resmi dari Meta)
// Dokumentasi: https://developers.facebook.com/docs/whatsapp/cloud-api
//
// PRASYARAT SEBELUM PAKAI:
// 1. Buat akun Meta for Developers (developers.facebook.com) + App tipe "Business"
// 2. Aktifkan produk "WhatsApp" di app tersebut, dapatkan nomor test gratis
//    (atau daftarkan nomor bisnis sungguhan untuk production)
// 3. Buat template di WhatsApp Manager dengan konfigurasi berikut (tersingkat &
//    paling cepat lolos review otomatis Meta karena strukturnya baku):
//      - Category      : Authentication
//      - Name          : otp_verification
//      - Language      : Indonesian (id)
//      - Code delivery : Copy code (JANGAN pilih "One-tap autofill", butuh
//                        setup deep link app tambahan yang tidak perlu di sini)
//      - Security recommendation : aktifkan ("Jangan bagikan kode ini...")
//      - Expiry time   : aktifkan, isi 5 menit
//    Body & tombol di-generate otomatis oleh Meta, tidak bisa ditulis manual
//    untuk kategori Authentication — itu sebabnya kategori ini paling cepat
//    disetujui (format sudah dikenali sistem review otomatis mereka).
// 4. Salin Permanent Access Token & Phone Number ID dari dashboard,
//    isi ke .env (WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID)
// ============================================================================

@Injectable()
export class MetaWhatsappProvider implements WhatsappProvider {
  private readonly logger = new Logger(MetaWhatsappProvider.name);
  private readonly apiUrl: string;
  private readonly accessToken: string;

  constructor(private config: ConfigService) {
    const phoneNumberId = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    this.accessToken = this.config.get<string>('WHATSAPP_ACCESS_TOKEN') ?? '';
    this.apiUrl = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
  }

  private formatNomor(nomorHp: string): string {
    // Meta butuh format internasional tanpa "+", mis. 62812xxxxxxx
    let nomor = nomorHp.replace(/\D/g, '');
    if (nomor.startsWith('0')) nomor = '62' + nomor.slice(1);
    if (!nomor.startsWith('62')) nomor = '62' + nomor;
    return nomor;
  }

  async sendOtp(nomorHp: string, code: string): Promise<void> {
    const to = this.formatNomor(nomorHp);

    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        // Nama & bahasa HARUS sama persis dengan template yang sudah di-approve
        // di WhatsApp Manager (lihat konfigurasi di komentar atas file ini).
        name: 'otp_verification',
        language: { code: 'id' },
        components: [
          {
            // Isi {{1}} di body — satu-satunya variabel untuk template Authentication
            type: 'body',
            parameters: [{ type: 'text', text: code }],
          },
          {
            // Tombol "Copy code" bawaan Meta untuk kategori Authentication.
            // sub_type WAJIB "copy_code" (bukan "url") agar cocok dengan
            // template yang di-generate otomatis oleh Meta.
            type: 'button',
            sub_type: 'copy_code',
            index: '0',
            parameters: [{ type: 'coupon_code', coupon_code: code }],
          },
        ],
      },
    };

    try {
      const res = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = await res.text();
        this.logger.error(`Gagal kirim OTP WhatsApp ke ${to}: ${errBody}`);
        throw new InternalServerErrorException('Gagal mengirim kode OTP via WhatsApp');
      }
    } catch (err) {
      this.logger.error(`Error koneksi ke WhatsApp API: ${err}`);
      throw new InternalServerErrorException('Gagal mengirim kode OTP via WhatsApp');
    }
  }
}
