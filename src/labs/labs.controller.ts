import {
  Body,
  Controller,
  Delete,
  Get,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AudienceGuard } from '../auth/guards/audience.guard';
import { HydraAuthGuard } from '../auth/guards/hydra-auth.guard';
import { ScopeGuard } from '../auth/guards/scope.guard';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { Scopes } from '../auth/decorators/scopes.decorator';
import { RESOURCE_SERVER_SCOPES } from '../auth/constants/auth.constants';
import {
  CreateLabDto,
  CreateLabResponseDto,
  PutLabResponseDto,
} from './dto/create-lab.dto';
import { DeleteLabResponseDto } from './dto/delete-lab.dto';
import { LabsService } from './labs.service';

@UseGuards(HydraAuthGuard, AudienceGuard, ScopeGuard)
@Controller('labs')
export class LabsController {
  constructor(private readonly labsService: LabsService) {}

  @Get('me')
  @Scopes(RESOURCE_SERVER_SCOPES.LABS_READ)
  getOwnLab(
    @Req() request: AuthenticatedRequest,
  ): Promise<CreateLabResponseDto> {
    return this.labsService.getLabByClientId(request.authToken?.clientId ?? '');
  }

  @Put('me')
  @Scopes(RESOURCE_SERVER_SCOPES.LABS_SELF_UPDATE)
  async labSelfUpdate(
    @Req() request: AuthenticatedRequest,
    @Body() createLabDto: CreateLabDto,
    @Res({ passthrough: true }) reply: { status: (code: number) => unknown },
  ): Promise<PutLabResponseDto> {
    const response = await this.labsService.labSelfUpdate(
      request.authToken?.clientId,
      createLabDto,
    );

    reply.status(response.action === 'created' ? 201 : 200);

    return response;
  }

  @Delete('me')
  @Scopes(RESOURCE_SERVER_SCOPES.LABS_SELF_DEREGISTER)
  labSelfDeregistration(
    @Req() request: AuthenticatedRequest,
  ): Promise<DeleteLabResponseDto> {
    return this.labsService.labSelfDeregistration(request.authToken?.clientId);
  }
}
