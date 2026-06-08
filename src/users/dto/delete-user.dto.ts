import { IsUUID } from 'class-validator';

export class DeleteUserDto {
  @IsUUID()
  id!: string;
}

export class DeleteUserDtoResponse {
  id!: string;
  name!: string;
  email!: string;
  roleName!: string;
  message!: string;
}
