import {
  ArgumentsHost,
  Catch,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import {
  AuditErrorContext,
  AuditedRequest,
} from './interfaces/audited-request.interface';
import { syncAuditRequestContext } from './utils/audit-context.util';

function getRecordValue(
  value: unknown,
  key: string,
): string | number | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const recordValue = (value as Record<string, unknown>)[key];

  if (typeof recordValue === 'string' || typeof recordValue === 'number') {
    return recordValue;
  }

  return undefined;
}

function toAuditErrorContext(exception: unknown): AuditErrorContext {
  if (exception instanceof HttpException) {
    const response = exception.getResponse();
    const responseCode =
      getRecordValue(response, 'code') ??
      getRecordValue(response, 'error') ??
      getRecordValue(response, 'statusCode');

    return {
      name: exception.name,
      message: exception.message,
      code: responseCode ? String(responseCode) : String(exception.getStatus()),
    };
  }

  if (exception instanceof Error) {
    const errorCode = getRecordValue(exception, 'code');

    return {
      name: exception.name,
      message: exception.message,
      code: errorCode ? String(errorCode) : undefined,
    };
  }

  return {
    name: 'UnknownError',
    message: 'Unknown exception was thrown',
  };
}

@Injectable()
@Catch()
export class RequestAuditExceptionFilter extends BaseExceptionFilter {
  constructor(httpAdapterHost: HttpAdapterHost) {
    super(httpAdapterHost.httpAdapter);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const request = host.switchToHttp().getRequest<AuditedRequest>();
    syncAuditRequestContext(request, toAuditErrorContext(exception));

    super.catch(exception, host);
  }
}
