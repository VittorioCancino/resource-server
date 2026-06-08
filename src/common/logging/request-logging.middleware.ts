import { Injectable, NestMiddleware } from '@nestjs/common';
import {
  AuditedReply,
  AuditedRequest,
} from './interfaces/audited-request.interface';
import { toApiRequestLogCreateInput } from './request-log.mapper';
import { RequestLoggingService } from './request-logging.service';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(private readonly requestLoggingService: RequestLoggingService) {}

  use(request: AuditedRequest, reply: AuditedReply, next: () => void): void {
    const startedAt = process.hrtime.bigint();

    const writeLog = () => {
      const durationMs = Math.round(
        Number(process.hrtime.bigint() - startedAt) / 1_000_000,
      );
      const data = toApiRequestLogCreateInput({ request, reply, durationMs });

      void this.requestLoggingService.write(data);
    };

    if (reply.raw) {
      reply.raw.once('finish', writeLog);
    } else {
      reply.once?.('finish', writeLog);
    }

    next();
  }
}
