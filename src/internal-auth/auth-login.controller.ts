import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { RESOURCE_SERVER_SCOPES } from '../auth/constants/auth.constants';
import { Scopes } from '../auth/decorators/scopes.decorator';
import { AudienceGuard } from '../auth/guards/audience.guard';
import { HydraAuthGuard } from '../auth/guards/hydra-auth.guard';
import { ScopeGuard } from '../auth/guards/scope.guard';
import {
  VerifyCredentialsDto,
  VerifyCredentialsResponseDto,
} from './dto/verify-credentials.dto';
import { InternalAuthService } from './internal-auth.service';

@UseGuards(HydraAuthGuard, AudienceGuard, ScopeGuard)
@Controller('auth')
export class AuthLoginController {
  constructor(private readonly internalAuthService: InternalAuthService) {}

  @Post('login')
  @Scopes(RESOURCE_SERVER_SCOPES.INTERNAL_AUTH_VERIFY_CREDENTIALS)
  login(
    @Body() verifyCredentialsDto: VerifyCredentialsDto,
  ): Promise<VerifyCredentialsResponseDto> {
    return this.internalAuthService.verifyCredentials(verifyCredentialsDto);
  }
}
