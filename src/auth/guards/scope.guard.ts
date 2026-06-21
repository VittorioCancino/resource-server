import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_SCOPES_KEY } from '../decorators/scopes.decorator';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

function resolveScopeTemplate(
  scope: string,
  params: Record<string, string | undefined> = {},
): string {
  return scope.replace(/:([A-Za-z0-9_]+)/g, (match, paramName: string) => {
    const value = params[paramName];

    if (!value) {
      throw new ForbiddenException(
        `Required scope parameter ${paramName} is missing`,
      );
    }

    return value;
  });
}

@Injectable()
export class ScopeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredScopes =
      this.reflector.getAllAndOverride<string[]>(REQUIRED_SCOPES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredScopes.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.authToken;

    if (!token) {
      throw new ForbiddenException('Authenticated token is missing');
    }

    const resolvedRequiredScopes = requiredScopes.map((scope) =>
      resolveScopeTemplate(scope, request.params),
    );

    const hasAllRequiredScopes = resolvedRequiredScopes.every((scope) =>
      token.scope.includes(scope),
    );

    if (!hasAllRequiredScopes) {
      throw new ForbiddenException('Token scope is not allowed');
    }

    return true;
  }
}
