import { IsUUID } from 'class-validator';

export class DeleteUserDto {
  @IsUUID()
  id!: string;
}

export class DeleteUserDtoResponse {
  id!: string;
  subject!: string;
  name!: string;
  email!: string;
  status!: string;
  message!: string;
}
