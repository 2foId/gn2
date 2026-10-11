import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WHATSAPP_PROVIDER } from './whatsapp-provider.interface';
import { MetaWhatsappProvider } from './providers/meta-whatsapp.provider';
import { FonnteWhatsappProvider } from './providers/fonnte-whatsapp.provider';
import { StubWhatsappProvider } from './providers/stub-whatsapp.provider';
import { HybridWhatsappProvider } from './providers/hybrid-whatsapp.provider';
import { WhatsappWebhookController } from './whatsapp-webhook.controller';

// Provider aktif ditentukan oleh env WHATSAPP_PROVIDER: "meta" | "fonnte" | "hybrid" | "stub".
// AuthService cukup inject token WHATSAPP_PROVIDER, tidak perlu tahu implementasi
// spesifik mana yang sedang dipakai — jadi ganti provider = ganti .env, tanpa ubah kode.
@Module({
  imports: [ConfigModule],
  controllers: [WhatsappWebhookController],
  providers: [
    MetaWhatsappProvider,
    FonnteWhatsappProvider,
    StubWhatsappProvider,
    HybridWhatsappProvider,
    {
      provide: WHATSAPP_PROVIDER,
      useFactory: (
        config: ConfigService,
        meta: MetaWhatsappProvider,
        fonnte: FonnteWhatsappProvider,
        stub: StubWhatsappProvider,
        hybrid: HybridWhatsappProvider,
      ) => {
        const provider = config.get<string>('WHATSAPP_PROVIDER') ?? 'stub';
        switch (provider) {
          case 'meta':
            return meta;
          case 'fonnte':
            return fonnte;
          case 'hybrid':
            return hybrid;
          default:
            return stub;
        }
      },
      inject: [
        ConfigService,
        MetaWhatsappProvider,
        FonnteWhatsappProvider,
        StubWhatsappProvider,
        HybridWhatsappProvider,
      ],
    },
  ],
  exports: [WHATSAPP_PROVIDER],
})
export class WhatsappModule { }