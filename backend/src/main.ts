import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // Chờ Winston khởi tạo xong mới ghi log
  });

  // Thay thế Logger mặc định của Nest bằng Winston
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // CORS
  app.enableCors({
    origin: '*',
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => new BadRequestException(errors),
    }),
  );

  // Lưu ý: app.useGlobalFilters(new GlobalExceptionFilter()) 
  // đã được dời vào app.module.ts để sử dụng Dependency Injection!

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Server running on port ${port}`);
}
bootstrap();
