import { TokenIntrospection } from './token-introspection.interface';

export interface AuthenticatedRequest {
  headers: {
    authorization?: string;
  };
  authToken?: TokenIntrospection;
}
