import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { WinstonModule } from 'nest-winston';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ChatsModule } from './modules/chats/chats.module';
import { winstonConfig } from './configs/winston.config';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

@Module({
  imports: [
    // Đọc file .env
    ConfigModule.forRoot({ isGlobal: true }),

    // Cấu hình MongoDB
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),

    // Tích hợp Winston Logging toàn cục
    WinstonModule.forRoot(winstonConfig),

    // Chống Spam API: Tối đa 100 requests / 60 giây (60000ms) cho mỗi IP
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    AuthModule,
    UsersModule,
    ChatsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Đưa Global Exception Filter vào DI để nó gọi được Winston Logger
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    // Kích hoạt ThrottlerGuard (chống DDoS) cho toàn bộ API
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}