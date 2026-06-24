import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, UserStatus } from '../../generated/prisma/client';
import {
  normalizeEmail,
  subjectFromEmail,
} from '../common/identity/user-identity.util';
import { hashPassword } from '../common/security/password-hash.util';
import { mapDbErrorToHttpException } from '../common/errors/db-http-exception';
import { safeDbCall } from '../common/errors/db-error';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, CreateUserDtoResponse } from './dto/create-user.dto';
import { DeleteUserDto, DeleteUserDtoResponse } from './dto/delete-user.dto';
import {
  ListUsersQueryDto,
  ListUsersResponseDto,
  UserDetailResponseDto,
} from './dto/user-list.dto';
import {
  UserMeProfileResponseDto,
  UserMeServiceRolesResponseDto,
} from './dto/user-me.dto';
import { toUserDetailResponse, toUserListItemResponse } from './users.mapper';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

const USER_WITH_SERVICES_SELECT = {
  id: true,
  subject: true,
  name: true,
  email: true,
  status: true,
  serviceMemberships: {
    select: {
      service: {
        select: {
          id: true,
          clientId: true,
          name: true,
          type: true,
        },
      },
      roles: {
        select: {
          serviceRole: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.UserSelect;

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

function parseUserStatus(value: string | undefined): UserStatus | undefined {
  const normalizedValue = value?.trim().toUpperCase();

  if (!normalizedValue) {
    return undefined;
  }

  const allowedStatuses = Object.values(UserStatus);

  if (!allowedStatuses.includes(normalizedValue as UserStatus)) {
    throw new BadRequestException(
      `status must be one of: ${allowedStatuses.join(', ')}`,
    );
  }

  return normalizedValue as UserStatus;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getUsers(query: ListUsersQueryDto): Promise<ListUsersResponseDto> {
    const page = parsePositiveInteger(query.page, DEFAULT_PAGE, 'page');
    const requestedPageSize = parsePositiveInteger(
      query.pageSize,
      DEFAULT_PAGE_SIZE,
      'pageSize',
    );
    const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE);
    const search = query.search?.trim();
    const status = parseUserStatus(query.status);
    const clientId = query.clientId?.trim();
    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (clientId) {
      where.serviceMemberships = {
        some: {
          service: {
            clientId,
          },
        },
      };
    }

    const result = await safeDbCall(() =>
      this.prisma.$transaction([
        this.prisma.user.count({ where }),
        this.prisma.user.findMany({
          where,
          select: USER_WITH_SERVICES_SELECT,
          orderBy: [{ name: 'asc' }, { email: 'asc' }, { id: 'asc' }],
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]),
    );

    if (!result.ok) {
      throw mapDbErrorToHttpException(result.error, {
        defaultMessage: 'Failed to read users',
      });
    }

    const [totalItems, users] = result.data;

    return {
      items: users.map(toUserListItemResponse),
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      },
    };
  }

  async getUserById(id: string): Promise<UserDetailResponseDto> {
    const result = await safeDbCall(() =>
      this.prisma.user.findUnique({
        where: { id },
        select: USER_WITH_SERVICES_SELECT,
      }),
    );

    if (!result.ok) {
      throw mapDbErrorToHttpException(result.error, {
        defaultMessage: 'Failed to read user',
      });
    }

    if (!result.data) {
      throw new NotFoundException('User was not found');
    }

    return toUserDetailResponse(result.data);
  }

  async getOwnProfile(
    subject: string | undefined,
  ): Promise<UserMeProfileResponseDto> {
    if (!subject) {
      throw new UnauthorizedException('Authenticated subject is missing');
    }

    const result = await safeDbCall(() =>
      this.prisma.user.findUnique({
        where: { subject },
        select: {
          subject: true,
          email: true,
          name: true,
          status: true,
        },
      }),
    );

    if (!result.ok) {
      throw mapDbErrorToHttpException(result.error, {
        defaultMessage: 'Failed to read user profile',
      });
    }

    if (!result.data) {
      throw new NotFoundException('User was not found');
    }

    return result.data;
  }

  async getOwnServiceRoles(
    subject: string | undefined,
    clientId: string,
  ): Promise<UserMeServiceRolesResponseDto> {
    if (!subject) {
      throw new UnauthorizedException('Authenticated subject is missing');
    }

    if (!clientId.trim()) {
      throw new BadRequestException('Service client id is required');
    }

    const normalizedClientId = clientId.trim();

    const serviceResult = await safeDbCall(() =>
      this.prisma.service.findUnique({
        where: { clientId: normalizedClientId },
        select: {
          clientId: true,
          name: true,
        },
      }),
    );

    if (!serviceResult.ok) {
      throw mapDbErrorToHttpException(serviceResult.error, {
        defaultMessage: 'Failed to read service roles',
      });
    }

    if (!serviceResult.data) {
      throw new NotFoundException('Service was not found');
    }

    const userResult = await safeDbCall(() =>
      this.prisma.user.findUnique({
        where: { subject },
        select: {
          subject: true,
          serviceMemberships: {
            where: {
              service: {
                clientId: normalizedClientId,
              },
            },
            select: {
              roles: {
                select: {
                  serviceRole: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
    );

    if (!userResult.ok) {
      throw mapDbErrorToHttpException(userResult.error, {
        defaultMessage: 'Failed to read user service roles',
      });
    }

    if (!userResult.data) {
      throw new NotFoundException('User was not found');
    }

    return {
      subject: userResult.data.subject,
      service: serviceResult.data,
      roles: userResult.data.serviceMemberships.flatMap((membership) =>
        membership.roles.map(
          (membershipRole) => membershipRole.serviceRole.name,
        ),
      ),
    };
  }

  async createUser(
    createUserDto: CreateUserDto,
  ): Promise<CreateUserDtoResponse> {
    const email = normalizeEmail(createUserDto.email);
    const subject = subjectFromEmail(email);
    const passwordHash = await hashPassword(createUserDto.password);

    const result = await safeDbCall(() =>
      this.prisma.user.create({
        data: {
          subject,
          name: createUserDto.name,
          email,
          credential: {
            create: {
              passwordHash,
            },
          },
        },
      }),
    );

    if (!result.ok) {
      throw mapDbErrorToHttpException(result.error, {
        uniqueFields: {
          subject: 'A user with this subject already exists',
          email: 'A user with this email already exists',
        },
        defaultMessage: 'Failed to create user',
      });
    }

    return {
      id: result.data.id,
      subject: result.data.subject,
      name: result.data.name,
      email: result.data.email,
      status: result.data.status,
    };
  }

  async deleteUser(
    deleteUserDto: DeleteUserDto,
  ): Promise<DeleteUserDtoResponse> {
    const result = await safeDbCall(() =>
      this.prisma.user.delete({
        where: {
          id: deleteUserDto.id,
        },
      }),
    );

    if (!result.ok) {
      throw mapDbErrorToHttpException(result.error, {
        notFoundMessage: 'User was not found',
        defaultMessage: 'Failed to delete user',
      });
    }

    return {
      id: result.data.id,
      subject: result.data.subject,
      name: result.data.name,
      email: result.data.email,
      status: result.data.status,
      message: 'User deleted successfully',
    };
  }
}
