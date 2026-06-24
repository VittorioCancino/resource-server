import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomInt } from 'node:crypto';
import {
  Prisma,
  UserRegistrationInvitationStatus,
} from '../../generated/prisma/client';
import { TokenIntrospection } from '../auth/interfaces/token-introspection.interface';
import { mapDbErrorToHttpException } from '../common/errors/db-http-exception';
import { safeDbCall } from '../common/errors/db-error';
import {
  normalizeEmail,
  subjectFromEmail,
} from '../common/identity/user-identity.util';
import { hashPassword } from '../common/security/password-hash.util';
import { PrismaService } from '../prisma/prisma.service';
import {
  ListRegistrationInvitationsQueryDto,
  ListRegistrationInvitationsResponseDto,
  RegisterWithInvitationDto,
  RegisterWithInvitationResponseDto,
  RegistrationInvitationResponseDto,
  ValidateRegistrationCodeResponseDto,
} from './dto/user-registration.dto';
import {
  toRegistrationInvitationResponse,
  toRegistrationServiceResponse,
} from './user-registration.mapper';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;
const MAX_CODE_ATTEMPTS = 8;
const SERVICE_ADMIN_ROLE = 'admin';
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

function normalizeInvitationCode(code: string): string {
  return code.trim().toUpperCase();
}

function normalizePersonName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

function normalizeClientId(clientId: string): string {
  return clientId.trim();
}

function generateInvitationCode(): string {
  let code = '';

  for (let index = 0; index < CODE_LENGTH; index += 1) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }

  return code;
}

function parsePositiveInteger(
  value: string | undefined,
  defaultValue: number,
  paramName: string,
): number {
  if (!value?.trim()) {
    return defaultValue;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    throw new BadRequestException(`${paramName} must be a positive integer`);
  }

  return parsedValue;
}

function parseInvitationStatus(
  value: string | undefined,
): UserRegistrationInvitationStatus | undefined {
  const normalizedValue = value?.trim().toUpperCase();

  if (!normalizedValue) {
    return undefined;
  }

  const allowedStatuses = Object.values(UserRegistrationInvitationStatus);

  if (
    !allowedStatuses.includes(
      normalizedValue as UserRegistrationInvitationStatus,
    )
  ) {
    throw new BadRequestException(
      `status must be one of: ${allowedStatuses.join(', ')}`,
    );
  }

  return normalizedValue as UserRegistrationInvitationStatus;
}

function parseCreatedBy(value: string | undefined): 'all' | 'me' {
  const normalizedValue = value?.trim().toLowerCase() || 'all';

  if (normalizedValue !== 'all' && normalizedValue !== 'me') {
    throw new BadRequestException('createdBy must be either all or me');
  }

  return normalizedValue;
}

@Injectable()
export class UserRegistrationService {
  constructor(private readonly prisma: PrismaService) {}

  private getInvitationInclude() {
    return {
      service: {
        select: {
          id: true,
          clientId: true,
          name: true,
          type: true,
        },
      },
      registeredUser: {
        select: {
          id: true,
          subject: true,
          email: true,
          name: true,
          status: true,
        },
      },
    };
  }

  private async getServiceByClientId(clientId: string) {
    const normalizedClientId = normalizeClientId(clientId);

    if (!normalizedClientId) {
      throw new NotFoundException('Service was not found');
    }

    const service = await this.prisma.service.findUnique({
      where: { clientId: normalizedClientId },
      select: {
        id: true,
        clientId: true,
        name: true,
        type: true,
      },
    });

    if (!service) {
      throw new NotFoundException('Service was not found');
    }

    return service;
  }

  private async assertServiceAdmin(
    authToken: TokenIntrospection | undefined,
    clientId: string,
  ) {
    const subject = authToken?.subject;

    if (!subject) {
      throw new UnauthorizedException('Authenticated subject is missing');
    }

    const service = await this.getServiceByClientId(clientId);
    const user = await this.prisma.user.findUnique({
      where: { subject },
      select: {
        serviceMemberships: {
          where: { serviceId: service.id },
          select: {
            roles: {
              where: {
                serviceRole: {
                  name: SERVICE_ADMIN_ROLE,
                },
              },
              select: {
                serviceRoleId: true,
              },
            },
          },
        },
      },
    });

    const hasAdminRole = user?.serviceMemberships.some(
      (membership) => membership.roles.length > 0,
    );

    if (!hasAdminRole) {
      throw new ForbiddenException('Service admin role is required');
    }

    return service;
  }

  private async createInvitationForService(
    serviceId: string,
    authToken: TokenIntrospection | undefined,
  ): Promise<RegistrationInvitationResponseDto> {
    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
      const code = generateInvitationCode();
      const result = await safeDbCall(() =>
        this.prisma.userRegistrationInvitation.create({
          data: {
            code,
            serviceId,
            createdBySubject: authToken?.subject,
            createdByClientId: authToken?.clientId,
          },
          include: this.getInvitationInclude(),
        }),
      );

      if (result.ok) {
        return toRegistrationInvitationResponse(result.data);
      }

      if (
        result.error.kind !== 'prisma-known' ||
        result.error.error.code !== 'P2002'
      ) {
        throw mapDbErrorToHttpException(result.error, {
          defaultMessage: 'Failed to create user registration invitation',
        });
      }
    }

    throw new ConflictException('Failed to generate a unique invitation code');
  }

  private async listInvitationsForService(
    serviceId: string,
  ): Promise<RegistrationInvitationResponseDto[]> {
    const invitations = await this.prisma.userRegistrationInvitation.findMany({
      where: { serviceId },
      include: this.getInvitationInclude(),
      orderBy: { createdAt: 'desc' },
    });

    return invitations.map(toRegistrationInvitationResponse);
  }

  private async listPaginatedInvitationsForService(
    serviceId: string,
    authToken: TokenIntrospection | undefined,
    query: ListRegistrationInvitationsQueryDto,
  ): Promise<ListRegistrationInvitationsResponseDto> {
    const page = parsePositiveInteger(query.page, DEFAULT_PAGE, 'page');
    const requestedPageSize = parsePositiveInteger(
      query.pageSize,
      DEFAULT_PAGE_SIZE,
      'pageSize',
    );
    const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE);
    const status = parseInvitationStatus(query.status);
    const createdBy = parseCreatedBy(query.createdBy);
    const where: Prisma.UserRegistrationInvitationWhereInput = { serviceId };

    if (status) {
      where.status = status;
    }

    if (createdBy === 'me') {
      if (!authToken?.subject) {
        throw new UnauthorizedException('Authenticated subject is missing');
      }

      where.createdBySubject = authToken.subject;
    }

    const result = await safeDbCall(() =>
      this.prisma.$transaction([
        this.prisma.userRegistrationInvitation.count({ where }),
        this.prisma.userRegistrationInvitation.findMany({
          where,
          include: this.getInvitationInclude(),
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]),
    );

    if (!result.ok) {
      throw mapDbErrorToHttpException(result.error, {
        defaultMessage: 'Failed to read user registration invitations',
      });
    }

    const [totalItems, invitations] = result.data;

    return {
      items: invitations.map(toRegistrationInvitationResponse),
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      },
    };
  }

  private async getInvitationForService(
    serviceId: string,
    invitationId: string,
  ): Promise<RegistrationInvitationResponseDto> {
    const result = await safeDbCall(() =>
      this.prisma.userRegistrationInvitation.findFirst({
        where: { id: invitationId, serviceId },
        include: this.getInvitationInclude(),
      }),
    );

    if (!result.ok) {
      throw mapDbErrorToHttpException(result.error, {
        defaultMessage: 'Failed to read user registration invitation',
      });
    }

    if (!result.data) {
      throw new NotFoundException('Registration invitation was not found');
    }

    return toRegistrationInvitationResponse(result.data);
  }

  private async activateInvitationForService(
    serviceId: string,
    invitationId: string,
  ): Promise<RegistrationInvitationResponseDto> {
    const invitation = await this.prisma.userRegistrationInvitation.findFirst({
      where: { id: invitationId, serviceId },
      select: { id: true, status: true, registeredUserId: true },
    });

    if (!invitation) {
      throw new NotFoundException('Registration invitation was not found');
    }

    if (invitation.status !== 'CLAIMED' || !invitation.registeredUserId) {
      throw new ConflictException(
        'Registration invitation is not ready to approve',
      );
    }

    const registeredUserId = invitation.registeredUserId;

    const result = await safeDbCall(() =>
      this.prisma.$transaction(async (transaction) => {
        await transaction.user.update({
          where: { id: registeredUserId },
          data: {
            status: 'ACTIVE',
          },
        });

        return transaction.userRegistrationInvitation.update({
          where: { id: invitation.id },
          data: {
            status: 'APPROVED',
            approvedAt: new Date(),
          },
          include: this.getInvitationInclude(),
        });
      }),
    );

    if (!result.ok) {
      throw mapDbErrorToHttpException(result.error, {
        defaultMessage: 'Failed to approve user registration invitation',
      });
    }

    return toRegistrationInvitationResponse(result.data);
  }

  private async deleteInvitationForService(
    serviceId: string,
    invitationId: string,
  ): Promise<{ id: string; message: string }> {
    const invitation = await this.prisma.userRegistrationInvitation.findFirst({
      where: { id: invitationId, serviceId },
      select: { id: true, status: true, registeredUserId: true },
    });

    if (!invitation) {
      throw new NotFoundException('Registration invitation was not found');
    }

    if (invitation.status === 'APPROVED') {
      throw new ConflictException('Approved invitations cannot be deleted');
    }

    const result = await safeDbCall(() =>
      this.prisma.$transaction(async (transaction) => {
        await transaction.userRegistrationInvitation.delete({
          where: { id: invitation.id },
        });

        if (invitation.registeredUserId) {
          await transaction.user.delete({
            where: { id: invitation.registeredUserId },
          });
        }
      }),
    );

    if (!result.ok) {
      throw mapDbErrorToHttpException(result.error, {
        defaultMessage: 'Failed to delete user registration invitation',
      });
    }

    return {
      id: invitation.id,
      message: 'Registration invitation deleted successfully',
    };
  }

  private async rejectInvitationForService(
    serviceId: string,
    invitationId: string,
  ): Promise<RegistrationInvitationResponseDto> {
    const invitation = await this.prisma.userRegistrationInvitation.findFirst({
      where: { id: invitationId, serviceId },
      select: {
        id: true,
        status: true,
        registeredUser: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Registration invitation was not found');
    }

    if (invitation.status !== 'CLAIMED' || !invitation.registeredUser) {
      throw new ConflictException(
        'Registration invitation is not ready to reject',
      );
    }

    if (invitation.registeredUser.status !== 'PENDING') {
      throw new ConflictException('Only pending users can be rejected');
    }

    const registeredUserId = invitation.registeredUser.id;

    const result = await safeDbCall(() =>
      this.prisma.$transaction(async (transaction) => {
        await transaction.userRegistrationInvitation.update({
          where: { id: invitation.id },
          data: {
            status: 'REJECTED',
          },
        });

        await transaction.user.delete({
          where: { id: registeredUserId },
        });

        return transaction.userRegistrationInvitation.findUniqueOrThrow({
          where: { id: invitation.id },
          include: this.getInvitationInclude(),
        });
      }),
    );

    if (!result.ok) {
      throw mapDbErrorToHttpException(result.error, {
        defaultMessage: 'Failed to reject user registration invitation',
      });
    }

    return toRegistrationInvitationResponse(result.data);
  }

  async createServiceInvitation(
    authToken: TokenIntrospection | undefined,
    clientId: string,
  ): Promise<RegistrationInvitationResponseDto> {
    const service = await this.assertServiceAdmin(authToken, clientId);

    return this.createInvitationForService(service.id, authToken);
  }

  async listServiceInvitations(
    authToken: TokenIntrospection | undefined,
    clientId: string,
    query: ListRegistrationInvitationsQueryDto,
  ): Promise<ListRegistrationInvitationsResponseDto> {
    const service = await this.assertServiceAdmin(authToken, clientId);

    return this.listPaginatedInvitationsForService(
      service.id,
      authToken,
      query,
    );
  }

  async getServiceInvitation(
    authToken: TokenIntrospection | undefined,
    clientId: string,
    invitationId: string,
  ): Promise<RegistrationInvitationResponseDto> {
    const service = await this.assertServiceAdmin(authToken, clientId);

    return this.getInvitationForService(service.id, invitationId);
  }

  async validateCode(
    code: string,
  ): Promise<ValidateRegistrationCodeResponseDto> {
    const invitation = await this.prisma.userRegistrationInvitation.findUnique({
      where: { code: normalizeInvitationCode(code) },
      select: {
        createdByClientId: true,
        createdBySubject: true,
        status: true,
        service: {
          select: {
            id: true,
            clientId: true,
            name: true,
            type: true,
          },
        },
      },
    });

    if (!invitation || invitation.status !== 'OPEN') {
      return { valid: false };
    }

    const creatorUser = invitation.createdBySubject
      ? await this.prisma.user.findUnique({
          where: { subject: invitation.createdBySubject },
          select: { name: true, subject: true },
        })
      : null;

    return {
      valid: true,
      creator:
        creatorUser ||
        invitation.createdBySubject ||
        invitation.createdByClientId
          ? {
              clientId: invitation.createdByClientId,
              name:
                creatorUser?.name ??
                invitation.createdBySubject ??
                invitation.createdByClientId ??
                'Unknown',
              subject: creatorUser?.subject ?? invitation.createdBySubject,
            }
          : null,
      service: toRegistrationServiceResponse(invitation.service),
    };
  }

  async registerWithInvitation(
    dto: RegisterWithInvitationDto,
  ): Promise<RegisterWithInvitationResponseDto> {
    const code = normalizeInvitationCode(dto.code);
    const email = normalizeEmail(dto.email);
    const name = normalizePersonName(dto.name);
    const subject = subjectFromEmail(email);
    const passwordHash = await hashPassword(dto.password);

    const invitation = await this.prisma.userRegistrationInvitation.findUnique({
      where: { code },
      select: { id: true, status: true },
    });

    if (!invitation || invitation.status !== 'OPEN') {
      throw new NotFoundException('Registration invitation was not found');
    }

    const result = await safeDbCall(() =>
      this.prisma.$transaction(async (transaction) => {
        const user = await transaction.user.create({
          data: {
            subject,
            email,
            name,
            status: 'PENDING',
            credential: {
              create: {
                passwordHash,
              },
            },
          },
          select: {
            id: true,
          },
        });

        return transaction.userRegistrationInvitation.update({
          where: { id: invitation.id },
          data: {
            status: 'CLAIMED',
            registeredUserId: user.id,
            registeredAt: new Date(),
          },
          include: this.getInvitationInclude(),
        });
      }),
    );

    if (!result.ok) {
      throw mapDbErrorToHttpException(result.error, {
        uniqueFields: {
          subject: 'A user with this subject already exists',
          email: 'A user with this email already exists',
          registeredUserId: 'This invitation was already claimed',
        },
        defaultMessage: 'Failed to register user with invitation',
      });
    }

    const response = toRegistrationInvitationResponse(result.data);

    if (!response.registeredUser) {
      throw new InternalServerErrorException('Registered user is missing');
    }

    return {
      registered: true,
      invitation: response,
      user: response.registeredUser,
    };
  }

  async activateServiceInvitation(
    authToken: TokenIntrospection | undefined,
    clientId: string,
    invitationId: string,
  ): Promise<RegistrationInvitationResponseDto> {
    const service = await this.assertServiceAdmin(authToken, clientId);

    return this.activateInvitationForService(service.id, invitationId);
  }

  async rejectServiceInvitation(
    authToken: TokenIntrospection | undefined,
    clientId: string,
    invitationId: string,
  ): Promise<RegistrationInvitationResponseDto> {
    const service = await this.assertServiceAdmin(authToken, clientId);

    return this.rejectInvitationForService(service.id, invitationId);
  }

  async deleteServiceInvitation(
    authToken: TokenIntrospection | undefined,
    clientId: string,
    invitationId: string,
  ): Promise<{ id: string; message: string }> {
    const service = await this.assertServiceAdmin(authToken, clientId);

    return this.deleteInvitationForService(service.id, invitationId);
  }
}
