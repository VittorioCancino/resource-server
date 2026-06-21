import { TokenIntrospection } from './token-introspection.interface';

export interface AuthenticatedRequest {
  headers: {
    authorization?: string;
  };
  params?: Record<string, string | undefined>;
  authToken?: TokenIntrospection;
}
