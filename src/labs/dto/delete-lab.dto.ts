export class DeleteLabResponseDto {
  id!: string;
  clientId!: string;
  code!: string;
  name!: string;
  location!: string | null;
  timezone!: string;
  isActive!: boolean;
  message!: string;
}
