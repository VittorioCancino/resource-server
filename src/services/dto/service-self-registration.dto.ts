import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
  MinLength,
} from 'class-validator';

export class SelfRegisterServiceDto {
  @IsNotEmpty()
  @IsString()
  name!: string;
}

export class CreateOwnServiceRoleDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9:_-]*$/, {
    message:
      'name must start with an alphanumeric character and contain only letters, numbers, colon, underscore, or hyphen',
  })
  name!: string;
}

export class ServiceSelfResponseDto {
  id!: string;
  clientId!: string;
  name!: string;
  type!: string;
  roles!: string[];
}

export class SelfRegisterServiceResponseDto extends ServiceSelfResponseDto {
  action!: 'created' | 'updated';
}

export class RegisterMaintainerAccountDto {
  @IsEmail()
  @IsString()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class MaintainerAccountResponseDto {
  id!: string;
  subject!: string;
  email!: string;
  name!: string;
  service!: {
    id: string;
    clientId: string;
    name: string;
    type: string;
  };
  action!: 'created' | 'updated';
}

export class ServiceRoleResponseDto {
  id!: string;
  serviceId!: string;
  name!: string;
}

export class AddUserToServiceDto {
  @IsUUID()
  userId!: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9:_-]*$/, {
    message:
      'roleName must start with an alphanumeric character and contain only letters, numbers, colon, underscore, or hyphen',
  })
  roleName!: string;
}

export class AddUserToServiceResponseDto {
  userId!: string;
  service!: {
    id: string;
    clientId: string;
    name: string;
    type: string;
  };
  role!: {
    id: string;
    name: string;
  };
}
