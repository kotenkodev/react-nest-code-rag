import {
  Catch,
  ArgumentsHost,
  ExceptionFilter,
  HttpException,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { appConfig, type AppConfig } from '../../config/app.config';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(appConfig.KEY)
    private readonly appConfiguration: AppConfig,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;

    const isDev = this.appConfiguration.nodeEnv !== 'production';

    let messageStr = 'Internal server error';
    let errorType = 'Internal Server Error';

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'string') {
        messageStr = res;
        errorType = exception.name || 'HttpException';
      } else if (typeof res === 'object' && res !== null) {
        const obj = res as Record<string, any>;
        messageStr = Array.isArray(obj.message)
          ? obj.message.join(', ')
          : obj.message || exception.message;
        errorType = obj.error || exception.name || 'HttpException';
      }
    } else if (exception instanceof Error) {
      messageStr = isDev ? exception.message : 'Internal server error';
    }

    const errorResponse: Record<string, unknown> = {
      statusCode: status,
      message: messageStr,
      error: errorType,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    if (isDev) {
      if (exception instanceof Error) {
        errorResponse.stack = exception.stack;
      } else if (exception) {
        errorResponse.details = exception;
      }
    }

    response.status(status).json(errorResponse);
  }
}
