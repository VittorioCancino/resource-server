import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma } from '../../generated/prisma/client';
import { TokenIntrospection } from '../auth/interfaces/token-introspection.interface';
import { mapDbErrorToHttpException } from '../common/errors/db-http-exception';
import { safeDbCall } from '../common/errors/db-error';
import { normalizeEmail } from '../common/identity/user-identity.util';
import { hashPassword } from '../common/security/password-hash.util';
import { PrismaService } from '../prisma/prisma.service';
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
import {
  toMaintainerAccountResponse,
  toServiceSelfResponse,
} from './services.mapper';

const SERVICE_WITH_ROLES_SELECT = {
  id: true,
  clientId: true,
  name: true,
  type: true,
  roles: {
    select: {
      name: true,
    },
  },
} satisfies Prisma.ServiceSelect;

const MAINTAINER_ACCOUNT_SELECT = {
  id: true,
  subject: true,
  email: true,
  name: true,
  service: {
    select: {
      id: true,
      clientId: true,
      name: true,
      type: true,
    },
  },
} satisfies Prisma.MaintainerAccountSelect;

const SERVICE_ADMIN_ROLE = 'admin';

function getAuthenticatedClientId(clientId: string | undefined): string {
  const normalizedClientId = clientId?.trim();

  if (!normalizedClientId) {
    throw new UnauthorizedException('Authenticated client id is missing');
  }

  return normalizedClientId;
}

function normalizeServiceName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

function normalizeRoleName(name: string): string {
  return name.trim().toLowerCase();
}

function maintainerSubjectFromClientId(
  clientId: string,
  maintainerId: string,
): string {
  return `maintainer:${clientId}:${maintainerId}`;
}

function maintainerNameFromEmail(email: string): string {
  return email.split('@')[0];
}

function getAuthenticatedSubject(subject: string | undefined): string {
  const normalizedSubject = subject?.trim();

  if (!normalizedSubject) {
    throw new UnauthorizedException('Authenticated subject is missing');
  }

  return normalizedSubject;
}

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertServiceAdmin(
    authToken: TokenIntrospection | undefined,
    clientId: string,
  ) {
    const subject = getAuthenticatedSubject(authToken?.subject);
    const normalizedClientId = getAuthenticatedClientId(clientId);
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

  async getOwnService(
    clientId: string | undefined,
  ): Promise<ServiceSelfResponseDto> {
    const authenticatedClientId = getAuthenticatedClientId(clientId);
    const result = await safeDbCall(() =>
      this.prisma.service.findUnique({
        where: { clientId: authenticatedClientId },
        select: SERVICE_WITH_ROLES_SELECT,
      }),
    );

    if (!result.ok) {
      throw mapDbErrorToHttpException(result.error, {
        defaultMessage: 'Failed to read service',
      });
    }

    if (!result.data) {
      throw new NotFoundException('Service was not found');
    }

    return toServiceSelfResponse(result.data);
  }

  async selfRegister(
    clientId: string | undefined,
    dto: SelfRegisterServiceDto,
  ): Promise<SelfRegisterServiceResponseDto> {
    const authenticatedClientId = getAuthenticatedClientId(clientId);
    const name = normalizeServiceName(dto.name);

    if (!name) {
      throw new BadRequestException('Service name is required');
    }

    const existingService = await this.prisma.service.findUnique({
      where: { clientId: authenticatedClientId },
      select: { id: true },
    });
    const result = await safeDbCall(() =>
      existingService
        ? this.prisma.service.update({
            where: { clientId: authenticatedClientId },
            data: {
              name,
              type: 'APPLICATION',
            },
            select: SERVICE_WITH_ROLES_SELECT,
          })
        : this.prisma.service.create({
            data: {
              clientId: authenticatedClientId,
              name,
              type: 'APPLICATION',
            },
            select: SERVICE_WITH_ROLES_SELECT,
          }),
    );

    if (!result.ok) {
      throw mapDbErrorToHttpException(result.error, {
        uniqueFields: {
          clientId: 'A service with this client id already exists',
        },
        defaultMessage: 'Failed to self-register service',
      });
    }

    return {
      ...toServiceSelfResponse(result.data),
      action: existingService ? 'updated' : 'created',
    };
  }

  async registerMaintainerAccount(
    clientId: string | undefined,
    dto: RegisterMaintainerAccountDto,
  ): Promise<MaintainerAccountResponseDto> {
    const authenticatedClientId = getAuthenticatedClientId(clientId);
    const email = normalizeEmail(dto.email);
    const name = maintainerNameFromEmail(email);
    const passwordHash = await hashPassword(dto.password);
    const service = await this.prisma.service.findUnique({
      where: { clientId: authenticatedClientId },
      select: { id: true },
    });

    if (!service) {
      throw new NotFoundException('Service was not found');
    }

    const existingAccount = await this.prisma.maintainerAccount.findUnique({
      where: { serviceId: service.id },
      select: { id: true },
    });
    const maintainerId = existingAccount?.id ?? randomUUID();
    const subject = maintainerSubjectFromClientId(
      authenticatedClientId,
      maintainerId,
    );
    const result = await safeDbCall(() =>
      existingAccount
        ? this.prisma.maintainerAccount.update({
            where: { serviceId: service.id },
            data: {
              subject,
              email,
              name,
              passwordHash,
            },
            select: MAINTAINER_ACCOUNT_SELECT,
          })
        : this.prisma.maintainerAccount.create({
            data: {
              id: maintainerId,
              serviceId: service.id,
              subject,
              email,
              name,
              passwordHash,
            },
            select: MAINTAINER_ACCOUNT_SELECT,
          }),
    );

    if (!result.ok) {
      throw mapDbErrorToHttpException(result.error, {
        uniqueFields: {
          email: 'A maintainer account with this email already exists',
          serviceId: 'This service already has a maintainer account',
          subject: 'A maintainer account with this subject already exists',
        },
        defaultMessage: 'Failed to register maintainer account',
      });
    }

    return toMaintainerAccountResponse(
      result.data,
      existingAccount ? 'updated' : 'created',
    );
  }

  async createOwnServiceRole(
    clientId: string | undefined,
    dto: CreateOwnServiceRoleDto,
  ): Promise<ServiceRoleResponseDto> {
    const authenticatedClientId = getAuthenticatedClientId(clientId);
    const roleName = normalizeRoleName(dto.name);
    const service = await this.prisma.service.findUnique({
      where: { clientId: authenticatedClientId },
      select: { id: true },
    });

    if (!service) {
      throw new NotFoundException('Service was not found');
    }

    const existingRole = await this.prisma.serviceRole.findUnique({
      where: {
        serviceId_name: {
          serviceId: service.id,
          name: roleName,
        },
      },
      select: { id: true },
    });

    if (existingRole) {
      throw new ConflictException('A role with this name already exists');
    }

    const result = await safeDbCall(() =>
      this.prisma.serviceRole.create({
        data: {
          serviceId: service.id,
          name: roleName,
        },
        select: {
          id: true,
          serviceId: true,
          name: true,
        },
      }),
    );

    if (!result.ok) {
      throw mapDbErrorToHttpException(result.error, {
        uniqueFields: {
          serviceId: 'A role with this name already exists',
        },
        defaultMessage: 'Failed to create service role',
      });
    }

    return result.data;
  }

  async addUserToService(
    authToken: TokenIntrospection | undefined,
    clientId: string,
    dto: AddUserToServiceDto,
  ): Promise<AddUserToServiceResponseDto> {
    const service = await this.assertServiceAdmin(authToken, clientId);
    const roleName = normalizeRoleName(dto.roleName);
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true, status: true },
    });

    if (!user) {
      throw new NotFoundException('User was not found');
    }

    if (user.status !== 'ACTIVE') {
      throw new ConflictException('Only active users can be added to services');
    }

    const role = await this.prisma.serviceRole.findUnique({
      where: {
        serviceId_name: {
          serviceId: service.id,
          name: roleName,
        },
      },
      select: { id: true, name: true },
    });

    if (!role) {
      throw new NotFoundException('Service role was not found');
    }

    const result = await safeDbCall(() =>
      this.prisma.$transaction(async (transaction) => {
        await transaction.userServiceMembership.upsert({
          where: {
            userId_serviceId: {
              userId: user.id,
              serviceId: service.id,
            },
          },
          update: {},
          create: {
            userId: user.id,
            serviceId: service.id,
          },
        });

        await transaction.userServiceMembershipRole.upsert({
          where: {
            userId_serviceId_serviceRoleId: {
              userId: user.id,
              serviceId: service.id,
              serviceRoleId: role.id,
            },
          },
          update: {},
          create: {
            userId: user.id,
            serviceId: service.id,
            serviceRoleId: role.id,
          },
        });
      }),
    );

    if (!result.ok) {
      throw mapDbErrorToHttpException(result.error, {
        defaultMessage: 'Failed to add user to service',
      });
    }

    return {
      userId: user.id,
      service,
      role,
    };
  }
}
