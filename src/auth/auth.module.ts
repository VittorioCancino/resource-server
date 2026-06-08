import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AudienceGuard } from './guards/audience.guard';
import { HydraAuthGuard } from './guards/hydra-auth.guard';
import { ScopeGuard } from './guards/scope.guard';

@Module({
  providers: [AuthService, HydraAuthGuard, AudienceGuard, ScopeGuard],
  exports: [AuthService, HydraAuthGuard, AudienceGuard, ScopeGuard],
})
export class AuthModule {}
