import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RESOURCE_SERVER_SCOPES } from '../auth/constants/auth.constants';
import { Scopes } from '../auth/decorators/scopes.decorator';
import { AudienceGuard } from '../auth/guards/audience.guard';
import { HydraAuthGuard } from '../auth/guards/hydra-auth.guard';
import { ScopeGuard } from '../auth/guards/scope.guard';
import { UsersService } from './users.service';
import { CreateUserDto, CreateUserDtoResponse } from './dto/create-user.dto';
import { DeleteUserDto, DeleteUserDtoResponse } from './dto/delete-user.dto';
import {
  ListUsersQueryDto,
  ListUsersResponseDto,
  UserDetailResponseDto,
  UserIdDto,
} from './dto/user-list.dto';

@UseGuards(HydraAuthGuard, AudienceGuard, ScopeGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Scopes(RESOURCE_SERVER_SCOPES.USERS_READ)
  getUsers(@Query() query: ListUsersQueryDto): Promise<ListUsersResponseDto> {
    return this.usersService.getUsers(query);
  }

  @Post()
  @Scopes(RESOURCE_SERVER_SCOPES.USERS_WRITE)
  createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<CreateUserDtoResponse> {
    return this.usersService.createUser(createUserDto);
  }

  @Get(':id')
  @Scopes(RESOURCE_SERVER_SCOPES.USERS_READ)
  getUserById(@Param() params: UserIdDto): Promise<UserDetailResponseDto> {
    return this.usersService.getUserById(params.id);
  }

  @Delete(':id')
  @Scopes(RESOURCE_SERVER_SCOPES.USERS_DELETE)
  deleteUser(
    @Param() deleteUserDto: DeleteUserDto,
  ): Promise<DeleteUserDtoResponse> {
    return this.usersService.deleteUser(deleteUserDto);
  }
}
