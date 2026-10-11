import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Res,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

// Endpoint ini yang diisi ke kolom "Callback URL" di Meta App Dashboard >
// WhatsApp > Configuration > Webhooks.
//
// Meta akan memanggil dua jenis request ke sini:
// 1. GET  -> saat kamu klik "Verify and Save" di dashboard (handshake sekali saja)
// 2. POST -> setiap kali ada event sungguhan (status pesan terkirim/dibaca,
//            atau pesan masuk dari user)
@Controller('webhooks/whatsapp')
export class WhatsappWebhookController {
  private readonly logger = new Logger(WhatsappWebhookController.name);

  constructor(private config: ConfigService) {}

  // ---------- 1. VERIFIKASI (dipanggil sekali saat klik "Verify and Save") ----------
  @Get()
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const expectedToken = this.config.get<string>('WHATSAPP_WEBHOOK_VERIFY_TOKEN');

    // Meta mengirim "hub.verify_token" — HARUS sama persis dengan yang kamu
    // isi di kolom "Verify token" pada dashboard Meta, dan sama dengan
    // WHATSAPP_WEBHOOK_VERIFY_TOKEN di .env.
    if (mode === 'subscribe' && token === expectedToken) {
      this.logger.log('Webhook WhatsApp berhasil diverifikasi Meta');
      // Meta mewajibkan kita membalas persis nilai "hub.challenge" sebagai
      // plain text (bukan JSON), status 200 — ini yang membuat tombol
      // "Verify and Save" di dashboard berubah sukses.
      return res.status(HttpStatus.OK).send(challenge);
    }

    this.logger.warn('Verifikasi webhook WhatsApp GAGAL — token tidak cocok');
    return res.sendStatus(HttpStatus.FORBIDDEN);
  }

  // ---------- 2. TERIMA EVENT (dipanggil Meta setiap ada update sungguhan) ----------
  @Post()
  @HttpCode(HttpStatus.OK)
  receiveEvent(@Body() payload: any) {
    // PENTING: Meta akan retry (kirim ulang) kalau endpoint ini tidak
    // membalas 200 dalam waktu singkat — jadi jangan taruh proses berat
    // (kirim email, hit API lain, dll) langsung di sini. Untuk kebutuhan
    // sederhana (cuma kirim OTP satu arah), cukup log saja / abaikan.
    try {
      const entry = payload?.entry?.[0];
      const changes = entry?.changes?.[0]?.value;

      // Contoh: status pesan (sent/delivered/read/failed)
      const statuses = changes?.statuses;
      if (statuses) {
        for (const s of statuses) {
          this.logger.log(`Status pesan WA ke ${s.recipient_id}: ${s.status}`);
        }
      }

      // Contoh: pesan masuk dari user (kalau nanti mau fitur balas otomatis)
      const messages = changes?.messages;
      if (messages) {
        for (const m of messages) {
          this.logger.log(`Pesan masuk dari ${m.from}: ${JSON.stringify(m.text ?? m.type)}`);
        }
      }
    } catch (err) {
      this.logger.error(`Gagal parse webhook event: ${err}`);
    }

    // Selalu balas 200 secepat mungkin, apa pun isinya, supaya Meta tidak retry.
    return { received: true };
  }
}
