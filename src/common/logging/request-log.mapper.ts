import { CreateRequestLogDto } from './dto/create-request-log.dto';
import {
  AuditedReply,
  AuditedRequest,
} from './interfaces/audited-request.interface';
import { redactValue } from './utils/redact.util';

export interface RequestLogMapperInput {
  request: AuditedRequest;
  reply: AuditedReply;
  durationMs: number;
}

function getHeaderValue(
  headers: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = headers[key];

  if (Array.isArray(value)) {
    return value.join(', ');
  }

  return value;
}

function getRequestId(request: AuditedRequest): string | undefined {
  return getHeaderValue(request.headers, 'x-request-id') ?? request.id;
}

function getRequestPath(request: AuditedRequest): string {
  const requestUrl = request.originalUrl ?? request.url ?? '/';

  try {
    return new URL(requestUrl, 'http://resource-server.local').pathname;
  } catch {
    return requestUrl.split('?')[0] || '/';
  }
}

function getStatusCode(reply: AuditedReply): number | undefined {
  return reply.statusCode ?? reply.raw?.statusCode;
}

function getClientIp(request: AuditedRequest): string | undefined {
  const forwardedFor = getHeaderValue(request.headers, 'x-forwarded-for');

  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim();
  }

  return request.ip ?? request.socket?.remoteAddress;
}

function getContentLength(request: AuditedRequest): number | undefined {
  const value = getHeaderValue(request.headers, 'content-length');

  if (!value) {
    return undefined;
  }

  const contentLength = Number(value);

  return Number.isFinite(contentLength) ? contentLength : undefined;
}

export function toApiRequestLogCreateInput({
  request,
  reply,
  durationMs,
}: RequestLogMapperInput): CreateRequestLogDto {
  const statusCode = getStatusCode(reply);
  const authToken = request.authToken;

  return {
    requestId: getRequestId(request),
    method: request.method ?? 'UNKNOWN',
    path: getRequestPath(request),
    route: request.routeOptions?.url,
    statusCode,
    durationMs,
    success: statusCode ? statusCode < 400 : false,
    clientIp: getClientIp(request),
    userAgent: getHeaderValue(request.headers, 'user-agent'),
    contentLength: getContentLength(request),
    clientId: authToken?.clientId,
    subject: authToken?.subject,
    tokenType: authToken?.tokenType,
    audiences: authToken?.aud ?? [],
    scopes: authToken?.scope ?? [],
    requestHeaders: redactValue(
      request.headers,
    ) as CreateRequestLogDto['requestHeaders'],
    requestQuery: redactValue(
      request.query,
    ) as CreateRequestLogDto['requestQuery'],
    requestBody: redactValue(
      request.body,
    ) as CreateRequestLogDto['requestBody'],
    errorName: request.auditError?.name,
    errorMessage: request.auditError?.message,
    errorCode: request.auditError?.code,
  };
}
