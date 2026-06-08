import { IsOptional, IsString } from 'class-validator';

export class CreateLabDto {
  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

export class CreateLabResponseDto {
  id!: string;
  clientId!: string;
  code!: string;
  name!: string;
  location!: string | null;
  timezone!: string;
  isActive!: boolean;
}

export class PutLabResponseDto extends CreateLabResponseDto {
  action!: 'created' | 'updated' | 'reactivated';
}
