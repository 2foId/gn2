import { Injectable, Logger } from '@nestjs/common';
import { WhatsappProvider } from '../whatsapp-provider.interface';

// Dipakai saat WHATSAPP_PROVIDER=stub di .env (default untuk development).
// Tidak mengirim pesan sungguhan, cuma mencetak kode OTP ke console log
// supaya development tetap bisa jalan tanpa akun provider WA aktif.
@Injectable()
export class StubWhatsappProvider implements WhatsappProvider {
  private readonly logger = new Logger('StubWhatsappProvider');

  async sendOtp(nomorHp: string, code: string): Promise<void> {
    this.logger.warn(`[STUB] Kode OTP untuk ${nomorHp}: ${code} (tidak dikirim sungguhan)`);
  }
}
