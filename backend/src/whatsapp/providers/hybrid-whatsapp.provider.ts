import { Injectable, Logger } from '@nestjs/common';
import { WhatsappProvider } from '../whatsapp-provider.interface';
import { FonnteWhatsappProvider } from './fonnte-whatsapp.provider';

// print OTP ke log (cadangan pasti keliatan), SEKALIGUS
// coba kirim real via Fonnte. Fonnte gagal (i.e. device disconnect pas demo)

@Injectable()
export class HybridWhatsappProvider implements WhatsappProvider {
  private readonly logger = new Logger('HybridWhatsappProvider');

  constructor(private fonnte: FonnteWhatsappProvider) { }

  async sendOtp(nomorHp: string, code: string): Promise<void> {
    // 1. Selalu cetak duluan sebagai cadangan pasti terlihat
    this.logger.warn(`[BACKUP LOG] Kode OTP untuk ${nomorHp}: ${code}`);

    // 2. Coba kirim sungguhan, tapi jangan sampai bikin proses gagal kalau error
    try {
      await this.fonnte.sendOtp(nomorHp, code);
      this.logger.log(`OTP juga berhasil dikirim via Fonnte ke ${nomorHp}`);
    } catch (err) {
      this.logger.error(
        `Fonnte gagal kirim (${err}), tapi proses tetap lanjut — pakai kode dari log di atas.`,
      );
      // sengaja TIDAK di-throw ulang, supaya register/login tidak ikut gagal
    }
  }
}