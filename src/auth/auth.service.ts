import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  HydraIntrospectionResponse,
  TokenIntrospection,
} from './interfaces/token-introspection.interface';

@Injectable()
export class AuthService {
  private readonly hydraAdminUrl = process.env.HYDRA_ADMIN_URL;

  async introspectToken(token: string): Promise<TokenIntrospection> {
    if (!this.hydraAdminUrl) {
      throw new InternalServerErrorException('HYDRA_ADMIN_URL is not set');
    }

    const response = await fetch(
      `${this.hydraAdminUrl}/admin/oauth2/introspect`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ token }),
      },
    );

    if (!response.ok) {
      throw new InternalServerErrorException(
        'Failed to introspect access token',
      );
    }

    const data = (await response.json()) as HydraIntrospectionResponse;

    return {
      active: data.active,
      scope: data.scope?.split(' ').filter(Boolean) ?? [],
      clientId: data.client_id,
      subject: data.sub,
      tokenType: data.token_type,
      exp: data.exp,
      iat: data.iat,
      nbf: data.nbf,
      aud: Array.isArray(data.aud) ? data.aud : data.aud ? [data.aud] : [],
    };
  }
}
