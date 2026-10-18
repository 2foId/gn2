import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BantuanModule } from './bantuan/bantuan.module';
import { WasiatModule } from './wasiat/wasiat.module';
import { UmkmModule } from './umkm/umkm.module';
import { AcaraModule } from './acara/acara.module';
import { MessagesModule } from './messages/messages.module';
import { UploadsModule } from './uploads/uploads.module';
import { DampakModule } from './dampak/dampak.module';
import { ScheduleModule } from '@nestjs/schedule';
import { LibraryModule } from './library/library.module';
import { BingkaiModule } from './bingkai/bingkai.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Rate limiting global: default maks 20 request / 60 detik per IP.
    // Endpoint login/register diberi limit lebih ketat lewat @Throttle() di controller-nya.
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 20,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    BantuanModule,
    WasiatModule,
    UmkmModule,
    AcaraModule,
    MessagesModule,
    UploadsModule,
    DampakModule,
    LibraryModule,
    BingkaiModule,
    ScheduleModule.forRoot(),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
