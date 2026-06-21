import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RESOURCE_SERVER_SCOPES } from '../auth/constants/auth.constants';
import { Scopes } from '../auth/decorators/scopes.decorator';
import { AudienceGuard } from '../auth/guards/audience.guard';
import { HydraAuthGuard } from '../auth/guards/hydra-auth.guard';
import { ScopeGuard } from '../auth/guards/scope.guard';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import {
  InvitationIdDto,
  ListRegistrationInvitationsQueryDto,
  ListRegistrationInvitationsResponseDto,
  RegisterWithInvitationDto,
  RegisterWithInvitationResponseDto,
  RegistrationCodeDto,
  RegistrationInvitationResponseDto,
  ValidateRegistrationCodeResponseDto,
} from './dto/user-registration.dto';
import { UserRegistrationService } from './user-registration.service';

@UseGuards(HydraAuthGuard, AudienceGuard, ScopeGuard)
@Controller()
export class UserRegistrationController {
  constructor(
    private readonly userRegistrationService: UserRegistrationService,
  ) {}

  @Post('user-registration/validate-code')
  @Scopes(RESOURCE_SERVER_SCOPES.USER_REGISTRATION_CODES_VALIDATE)
  validateCode(
    @Body() dto: RegistrationCodeDto,
  ): Promise<ValidateRegistrationCodeResponseDto> {
    return this.userRegistrationService.validateCode(dto.code);
  }

  @Post('user-registration/register')
  @Scopes(RESOURCE_SERVER_SCOPES.USER_REGISTRATION_REGISTRATIONS_WRITE)
  registerWithInvitation(
    @Body() dto: RegisterWithInvitationDto,
  ): Promise<RegisterWithInvitationResponseDto> {
    return this.userRegistrationService.registerWithInvitation(dto);
  }
}

@UseGuards(HydraAuthGuard, AudienceGuard, ScopeGuard)
@Controller('labs/me/user-registration-invitations')
export class LabUserRegistrationController {
  constructor(
    private readonly userRegistrationService: UserRegistrationService,
  ) {}

  @Post()
  @Scopes(RESOURCE_SERVER_SCOPES.USER_REGISTRATION_INVITATIONS_WRITE)
  createInvitation(
    @Req() request: AuthenticatedRequest,
  ): Promise<RegistrationInvitationResponseDto> {
    return this.userRegistrationService.createInvitation(request.authToken);
  }

  @Get()
  @Scopes(RESOURCE_SERVER_SCOPES.USER_REGISTRATION_INVITATIONS_READ)
  listOwnLabInvitations(
    @Req() request: AuthenticatedRequest,
  ): Promise<RegistrationInvitationResponseDto[]> {
    return this.userRegistrationService.listOwnLabInvitations(
      request.authToken,
    );
  }

  @Post(':id/activate')
  @Scopes(RESOURCE_SERVER_SCOPES.USER_REGISTRATION_INVITATIONS_APPROVE)
  activateInvitation(
    @Req() request: AuthenticatedRequest,
    @Param() params: InvitationIdDto,
  ): Promise<RegistrationInvitationResponseDto> {
    return this.userRegistrationService.activateInvitation(
      request.authToken,
      params.id,
    );
  }

  @Delete(':id')
  @Scopes(RESOURCE_SERVER_SCOPES.USER_REGISTRATION_INVITATIONS_DELETE)
  deleteInvitation(
    @Req() request: AuthenticatedRequest,
    @Param() params: InvitationIdDto,
  ): Promise<{ id: string; message: string }> {
    return this.userRegistrationService.deleteInvitation(
      request.authToken,
      params.id,
    );
  }
}

@UseGuards(HydraAuthGuard, AudienceGuard, ScopeGuard)
@Controller('services/:serviceKey/user-registration-invitations')
export class ServiceUserRegistrationController {
  constructor(
    private readonly userRegistrationService: UserRegistrationService,
  ) {}

  @Post()
  @Scopes(RESOURCE_SERVER_SCOPES.USER_REGISTRATION_INVITATIONS_WRITE)
  createInvitation(
    @Req() request: AuthenticatedRequest,
    @Param('serviceKey') serviceKey: string,
  ): Promise<RegistrationInvitationResponseDto> {
    return this.userRegistrationService.createServiceInvitation(
      request.authToken,
      serviceKey,
    );
  }

  @Get()
  @Scopes(RESOURCE_SERVER_SCOPES.USER_REGISTRATION_INVITATIONS_READ)
  listServiceInvitations(
    @Req() request: AuthenticatedRequest,
    @Param('serviceKey') serviceKey: string,
    @Query() query: ListRegistrationInvitationsQueryDto,
  ): Promise<ListRegistrationInvitationsResponseDto> {
    return this.userRegistrationService.listServiceInvitations(
      request.authToken,
      serviceKey,
      query,
    );
  }

  @Get(':id')
  @Scopes(RESOURCE_SERVER_SCOPES.USER_REGISTRATION_INVITATIONS_READ)
  getServiceInvitation(
    @Req() request: AuthenticatedRequest,
    @Param('serviceKey') serviceKey: string,
    @Param() params: InvitationIdDto,
  ): Promise<RegistrationInvitationResponseDto> {
    return this.userRegistrationService.getServiceInvitation(
      request.authToken,
      serviceKey,
      params.id,
    );
  }

  @Post(':id/activate')
  @Scopes(RESOURCE_SERVER_SCOPES.USER_REGISTRATION_INVITATIONS_APPROVE)
  activateInvitation(
    @Req() request: AuthenticatedRequest,
    @Param('serviceKey') serviceKey: string,
    @Param() params: InvitationIdDto,
  ): Promise<RegistrationInvitationResponseDto> {
    return this.userRegistrationService.activateServiceInvitation(
      request.authToken,
      serviceKey,
      params.id,
    );
  }

  @Delete(':id')
  @Scopes(RESOURCE_SERVER_SCOPES.USER_REGISTRATION_INVITATIONS_DELETE)
  deleteInvitation(
    @Req() request: AuthenticatedRequest,
    @Param('serviceKey') serviceKey: string,
    @Param() params: InvitationIdDto,
  ): Promise<{ id: string; message: string }> {
    return this.userRegistrationService.deleteServiceInvitation(
      request.authToken,
      serviceKey,
      params.id,
    );
  }
}
