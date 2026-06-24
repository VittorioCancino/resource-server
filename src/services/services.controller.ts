import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
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
  AddUserToServiceDto,
  AddUserToServiceResponseDto,
  CreateOwnServiceRoleDto,
  MaintainerAccountResponseDto,
  RegisterMaintainerAccountDto,
  SelfRegisterServiceDto,
  SelfRegisterServiceResponseDto,
  ServiceRoleResponseDto,
  ServiceSelfResponseDto,
} from './dto/service-self-registration.dto';
import { ServicesService } from './services.service';

@UseGuards(HydraAuthGuard, AudienceGuard, ScopeGuard)
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get('me')
  @Scopes(RESOURCE_SERVER_SCOPES.SERVICES_SELF_READ)
  getOwnService(
    @Req() request: AuthenticatedRequest,
  ): Promise<ServiceSelfResponseDto> {
    return this.servicesService.getOwnService(request.authToken?.clientId);
  }

  @Put('me')
  @Scopes(RESOURCE_SERVER_SCOPES.SERVICES_SELF_REGISTER)
  selfRegister(
    @Req() request: AuthenticatedRequest,
    @Body() dto: SelfRegisterServiceDto,
  ): Promise<SelfRegisterServiceResponseDto> {
    return this.servicesService.selfRegister(request.authToken?.clientId, dto);
  }

  @Put('me/maintainer-account')
  @Scopes(RESOURCE_SERVER_SCOPES.SERVICES_SELF_MAINTAINER_ACCOUNT_WRITE)
  registerMaintainerAccount(
    @Req() request: AuthenticatedRequest,
    @Body() dto: RegisterMaintainerAccountDto,
  ): Promise<MaintainerAccountResponseDto> {
    return this.servicesService.registerMaintainerAccount(
      request.authToken?.clientId,
      dto,
    );
  }

  @Post('me/roles')
  @Scopes(RESOURCE_SERVER_SCOPES.SERVICES_SELF_ROLES_WRITE)
  createOwnServiceRole(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateOwnServiceRoleDto,
  ): Promise<ServiceRoleResponseDto> {
    return this.servicesService.createOwnServiceRole(
      request.authToken?.clientId,
      dto,
    );
  }

  @Post(':clientId/users')
  @Scopes(RESOURCE_SERVER_SCOPES.SERVICES_USERS_WRITE)
  addUserToService(
    @Req() request: AuthenticatedRequest,
    @Param('clientId') clientId: string,
    @Body() dto: AddUserToServiceDto,
  ): Promise<AddUserToServiceResponseDto> {
    return this.servicesService.addUserToService(
      request.authToken,
      clientId,
      dto,
    );
  }
}
