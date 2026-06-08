import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuditedRequest } from './interfaces/audited-request.interface';
import { syncAuditRequestContext } from './utils/audit-context.util';

@Injectable()
export class RequestAuditContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuditedRequest>();
    syncAuditRequestContext(request);

    return next.handle();
  }
}
