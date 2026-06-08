import { Injectable } from '@nestjs/common';
import { mapDbErrorToHttpException } from '../common/errors/db-http-exception';
import { safeDbCall } from '../common/errors/db-error';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, CreateUserDtoResponse } from './dto/create-user.dto';
import { DeleteUserDto, DeleteUserDtoResponse } from './dto/delete-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
  getUsers() {
    return this.prisma.user.findMany();
  }

  async createUser(
    createUserDto: CreateUserDto,
  ): Promise<CreateUserDtoResponse> {
    const result = await safeDbCall(() =>
      this.prisma.user.create({
        data: {
          name: createUserDto.name,
          email: createUserDto.email,
          role: {
            connect: {
              name: createUserDto.roleName,
            },
          },
        },
        include: {
          role: true,
        },
      }),
    );

    if (!result.ok) {
      throw mapDbErrorToHttpException(result.error, {
        uniqueFields: {
          email: 'A user with this email already exists',
        },
        notFoundMessage: 'Role was not found',
        defaultMessage: 'Failed to create user',
      });
    }

    return {
      id: result.data.id,
      name: result.data.name,
      email: result.data.email,
      roleName: result.data.role.name,
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
        include: {
          role: true,
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
      name: result.data.name,
      email: result.data.email,
      roleName: result.data.role.name,
      message: 'User deleted successfully',
    };
  }
}
