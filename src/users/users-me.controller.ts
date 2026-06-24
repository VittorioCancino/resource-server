import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { RESOURCE_SERVER_SCOPES } from '../auth/constants/auth.constants';
import { Scopes } from '../auth/decorators/scopes.decorator';
import { AudienceGuard } from '../auth/guards/audience.guard';
import { HydraAuthGuard } from '../auth/guards/hydra-auth.guard';
import { ScopeGuard } from '../auth/guards/scope.guard';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import {
  UserMeProfileResponseDto,
  UserMeServiceRolesResponseDto,
} from './dto/user-me.dto';
import { UsersService } from './users.service';

@UseGuards(HydraAuthGuard, AudienceGuard, ScopeGuard)
@Controller('users/me')
export class UsersMeController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @Scopes(RESOURCE_SERVER_SCOPES.USERS_ME_PROFILE_READ)
  getOwnProfile(
    @Req() request: AuthenticatedRequest,
  ): Promise<UserMeProfileResponseDto> {
    return this.usersService.getOwnProfile(request.authToken?.subject);
  }

  @Get('services/:clientId/roles')
  @Scopes(RESOURCE_SERVER_SCOPES.USERS_ME_SERVICE_ROLES_READ)
  getOwnServiceRoles(
    @Req() request: AuthenticatedRequest,
    @Param('clientId') clientId: string,
  ): Promise<UserMeServiceRolesResponseDto> {
    return this.usersService.getOwnServiceRoles(
      request.authToken?.subject,
      clientId,
    );
  }
}
