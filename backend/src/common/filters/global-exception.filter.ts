import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  // Tiêm (Inject) Winston Logger vào Filter
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) { }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let message = 'Internal server error';
    let details = null;

    if (exceptionResponse) {
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const res = exceptionResponse as any;

        // Nếu message là array (thường là lỗi từ ValidationPipe), chuyển nó vào details
        message = Array.isArray(res.message)
          ? 'Validation failed'
          : res.message || message;

        details = Array.isArray(res.message) ? res.message : (res.error || null);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Bảo mật: Ẩn thông tin lỗi hệ thống (database, syntax error,...) đối với lỗi 500
    if (status === 500) {
      message = 'Internal server error';
    }

    // Ghi log lỗi bằng Winston (tự động lưu ra file logs/error.log)
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      {
        stack: exception instanceof Error ? exception.stack : null,
        context: 'GlobalExceptionFilter',
        details: details,
      },
    );

    // Trả về cấu trúc JSON đồng nhất cho mọi lỗi
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      ...(details ? { details } : {}),
    });
  }
}
