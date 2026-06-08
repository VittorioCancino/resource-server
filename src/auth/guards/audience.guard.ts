import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { RESOURCE_SERVER_AUDIENCE } from '../constants/auth.constants';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

@Injectable()
export class AudienceGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const introspectedToken = request.authToken;

    if (!introspectedToken) {
      throw new ForbiddenException('Authenticated token is missing');
    }

    if (!introspectedToken.aud.includes(RESOURCE_SERVER_AUDIENCE)) {
      throw new ForbiddenException('Token audience is not allowed');
    }

    return true;
  }
}
