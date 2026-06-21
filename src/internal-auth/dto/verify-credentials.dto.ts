import { IsEmail, IsString } from 'class-validator';

export class VerifyCredentialsDto {
  @IsEmail()
  @IsString()
  email!: string;

  @IsString()
  password!: string;
}

export class VerifyCredentialsResponseDto {
  authenticated!: boolean;
  subject?: string;
  email?: string;
  name?: string;
}
