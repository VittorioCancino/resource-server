export interface TokenIntrospection {
  active: boolean;
  scope: string[];
  clientId?: string;
  subject?: string;
  tokenType?: string;
  exp?: number;
  iat?: number;
  nbf?: number;
  aud: string[];
}

export interface HydraIntrospectionResponse {
  active: boolean;
  scope?: string;
  client_id?: string;
  sub?: string;
  token_type?: string;
  exp?: number;
  iat?: number;
  nbf?: number;
  aud?: string[] | string;
}
