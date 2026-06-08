import {
  AuditErrorContext,
  AuditedRequest,
} from '../interfaces/audited-request.interface';

export function syncAuditRequestContext(
  request: AuditedRequest,
  auditError?: AuditErrorContext,
): void {
  const target = request.raw ?? request;

  target.id = request.id ?? target.id;
  target.query = request.query ?? target.query;
  target.body = request.body ?? target.body;
  target.routeOptions = request.routeOptions ?? target.routeOptions;
  target.authToken = request.authToken ?? target.authToken;
  target.auditError = auditError ?? request.auditError ?? target.auditError;
}
