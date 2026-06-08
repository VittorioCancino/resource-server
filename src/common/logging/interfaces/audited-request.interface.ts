import { TokenIntrospection } from '../../../auth/interfaces/token-introspection.interface';

export interface AuditErrorContext {
  name?: string;
  message?: string;
  code?: string;
}

export interface AuditedRequest {
  id?: string;
  method?: string;
  url?: string;
  originalUrl?: string;
  routeOptions?: {
    url?: string;
  };
  headers: Record<string, string | string[] | undefined>;
  query?: unknown;
  body?: unknown;
  ip?: string;
  socket?: {
    remoteAddress?: string;
  };
  authToken?: TokenIntrospection;
  auditError?: AuditErrorContext;
  raw?: AuditedRequest;
}

export interface AuditedReply {
  statusCode?: number;
  once?: (event: 'finish', listener: () => void) => void;
  raw?: {
    once: (event: 'finish', listener: () => void) => void;
    statusCode?: number;
  };
}
