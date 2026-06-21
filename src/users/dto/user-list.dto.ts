import { IsOptional, IsString, IsUUID } from 'class-validator';

export class ListUsersQueryDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  pageSize?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  serviceKey?: string;
}

export class UserIdDto {
  @IsUUID()
  id!: string;
}

export class UserServiceSummaryResponseDto {
  id!: string;
  key!: string;
  name!: string;
  type!: string;
  roles!: string[];
}

export class UserLaboratorySummaryResponseDto {
  id!: string;
  clientId!: string;
  code!: string;
  name!: string;
  location!: string | null;
  timezone!: string;
  isActive!: boolean;
}

export class UserServiceDetailResponseDto extends UserServiceSummaryResponseDto {
  laboratory!: UserLaboratorySummaryResponseDto | null;
}

export class UserListItemResponseDto {
  id!: string;
  subject!: string;
  name!: string;
  email!: string;
  status!: string;
  services!: UserServiceSummaryResponseDto[];
}

export class UserDetailResponseDto {
  id!: string;
  subject!: string;
  name!: string;
  email!: string;
  status!: string;
  services!: UserServiceDetailResponseDto[];
}

export class UsersPaginationResponseDto {
  page!: number;
  pageSize!: number;
  totalItems!: number;
  totalPages!: number;
}

export class ListUsersResponseDto {
  items!: UserListItemResponseDto[];
  pagination!: UsersPaginationResponseDto;
}
