import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  name!: string;

  @IsEmail()
  @IsString()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class CreateUserDtoResponse {
  id!: string;
  subject!: string;
  name!: string;
  email!: string;
  status!: string;
}
