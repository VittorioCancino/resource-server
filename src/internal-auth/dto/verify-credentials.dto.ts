import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

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

export class VerifyMaintainerCredentialsDto extends VerifyCredentialsDto {
  @IsNotEmpty()
  @IsString()
  serviceClientId!: string;
}

export class VerifyMaintainerCredentialsResponseDto {
  authenticated!: boolean;
  accountType?: 'maintainer';
  subject?: string;
  email?: string;
  name?: string;
  service?: {
    id: string;
    clientId: string;
    name: string;
    type: string;
  };
}
