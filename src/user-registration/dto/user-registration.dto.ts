import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';

export class RegistrationCodeDto {
  @IsString()
  @Length(8, 8)
  @Matches(/^[A-Za-z0-9]+$/)
  code!: string;
}

export class RegisterWithInvitationDto extends RegistrationCodeDto {
  @IsString()
  @Matches(/^\s*\S+(?:\s+\S+)+\s*$/, {
    message: 'name must include names and surnames',
  })
  name!: string;

  @IsEmail()
  @IsString()
  @Matches(/^[^\s@]+@(alumnos\.uai\.cl|uai\.cl|edu\.uai\.cl)$/i, {
    message: 'email must use @alumnos.uai.cl, @uai.cl, or @edu.uai.cl',
  })
  email!: string;

  @IsString()
  @MinLength(8)
  @Matches(/\d/, { message: 'password must contain at least one number' })
  @Matches(/[^A-Za-z0-9\s]/, {
    message: 'password must contain at least one special symbol',
  })
  password!: string;
}

export class InvitationIdDto {
  @IsString()
  id!: string;
}

export class ListRegistrationInvitationsQueryDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  pageSize?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  createdBy?: string;
}

export class RegistrationLaboratoryResponseDto {
  id!: string;
  code!: string;
  name!: string;
}

export class RegistrationServiceResponseDto {
  id!: string;
  key!: string;
  name!: string;
  type!: string;
}

export class RegistrationUserResponseDto {
  id!: string;
  subject!: string;
  email!: string;
  name!: string;
  status!: string;
}

export class RegistrationInvitationCreatorResponseDto {
  name!: string;
  subject!: string | null;
  clientId!: string | null;
}

export class RegistrationInvitationResponseDto {
  id!: string;
  code!: string;
  status!: string;
  createdAt!: Date;
  registeredAt!: Date | null;
  approvedAt!: Date | null;
  createdBySubject!: string | null;
  createdByClientId!: string | null;
  service!: RegistrationServiceResponseDto;
  laboratory!: RegistrationLaboratoryResponseDto | null;
  registeredUser!: RegistrationUserResponseDto | null;
}

export class ValidateRegistrationCodeResponseDto {
  valid!: boolean;
  service?: RegistrationServiceResponseDto;
  laboratory?: RegistrationLaboratoryResponseDto | null;
  creator?: RegistrationInvitationCreatorResponseDto | null;
}

export class RegisterWithInvitationResponseDto {
  registered!: boolean;
  invitation!: RegistrationInvitationResponseDto;
  user!: RegistrationUserResponseDto;
}

export class RegistrationInvitationsPaginationResponseDto {
  page!: number;
  pageSize!: number;
  totalItems!: number;
  totalPages!: number;
}

export class ListRegistrationInvitationsResponseDto {
  items!: RegistrationInvitationResponseDto[];
  pagination!: RegistrationInvitationsPaginationResponseDto;
}
