import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { mapDbErrorToHttpException } from '../common/errors/db-http-exception';
import { safeDbCall } from '../common/errors/db-error';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateLabDto,
  CreateLabResponseDto,
  PutLabResponseDto,
} from './dto/create-lab.dto';
import { DeleteLabResponseDto } from './dto/delete-lab.dto';
import {
  toDeleteLabResponse,
  toLabResponse,
  toPutLabResponse,
} from './labs.mapper';

@Injectable()
export class LabsService {
  constructor(private readonly prisma: PrismaService) {}

  async getLabByClientId(clientId: string): Promise<CreateLabResponseDto> {
    if (!clientId) {
      throw new InternalServerErrorException(
        'Authenticated client id is missing',
      );
    }

    const lab = await this.prisma.laboratory.findUnique({
      where: { clientId },
    });

    if (!lab) {
      throw new NotFoundException('Laboratory was not found');
    }

    return toLabResponse(lab);
  }

  async labSelfUpdate(
    clientId: string | undefined,
    createLabDto: CreateLabDto,
  ): Promise<PutLabResponseDto> {
    if (!clientId) {
      throw new InternalServerErrorException(
        'Authenticated client id is missing',
      );
    }

    const currentLab = await this.prisma.laboratory.findUnique({
      where: { clientId },
    });

    if (!currentLab) {
      const createResult = await safeDbCall(() =>
        this.prisma.laboratory.create({
          data: {
            clientId,
            code: createLabDto.code,
            name: createLabDto.name,
            location: createLabDto.location,
            timezone: createLabDto.timezone ?? 'UTC',
          },
        }),
      );

      if (!createResult.ok) {
        throw mapDbErrorToHttpException(createResult.error, {
          uniqueFields: {
            clientId: 'A laboratory with this client id already exists',
            code: 'A laboratory with this code already exists',
          },
          defaultMessage: 'Failed to create laboratory',
        });
      }

      return toPutLabResponse(createResult.data, 'created');
    }

    const updateResult = await safeDbCall(() =>
      this.prisma.laboratory.update({
        where: { clientId },
        data: {
          code: createLabDto.code,
          name: createLabDto.name,
          location: createLabDto.location,
          timezone: createLabDto.timezone ?? 'UTC',
          isActive: true,
        },
      }),
    );

    if (!updateResult.ok) {
      throw mapDbErrorToHttpException(updateResult.error, {
        uniqueFields: {
          code: 'A laboratory with this code already exists',
        },
        defaultMessage: 'Failed to update laboratory',
      });
    }

    return toPutLabResponse(
      updateResult.data,
      currentLab.isActive ? 'updated' : 'reactivated',
    );
  }

  async labSelfDeregistration(
    clientId: string | undefined,
  ): Promise<DeleteLabResponseDto> {
    if (!clientId) {
      throw new InternalServerErrorException(
        'Authenticated client id is missing',
      );
    }

    const lab = await this.prisma.laboratory.findUnique({
      where: { clientId },
    });

    if (!lab) {
      throw new NotFoundException('Laboratory was not found');
    }

    if (!lab.isActive) {
      throw new ConflictException('Laboratory is already deregistered');
    }

    const result = await safeDbCall(() =>
      this.prisma.laboratory.update({
        where: { clientId },
        data: {
          isActive: false,
        },
      }),
    );

    if (!result.ok) {
      throw mapDbErrorToHttpException(result.error, {
        notFoundMessage: 'Laboratory was not found',
        defaultMessage: 'Failed to deregister laboratory',
      });
    }

    return toDeleteLabResponse(
      result.data,
      'Laboratory deregistered successfully',
    );
  }
}
