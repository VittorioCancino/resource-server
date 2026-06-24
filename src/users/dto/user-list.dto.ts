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
  clientId?: string;
}

export class UserIdDto {
  @IsUUID()
  id!: string;
}

export class UserServiceSummaryResponseDto {
  id!: string;
  clientId!: string;
  name!: string;
  type!: string;
  roles!: string[];
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
  services!: UserServiceSummaryResponseDto[];
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
