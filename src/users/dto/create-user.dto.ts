import { IsString, IsEmail } from 'class-validator';

export class CreateUserDto {
  @IsString()
  name!: string;

  @IsEmail()
  @IsString()
  email!: string;

  @IsString()
  roleName!: string;
}

export class CreateUserDtoResponse {
  id!: string;
  name!: string;
  email!: string;
  roleName!: string;
}
