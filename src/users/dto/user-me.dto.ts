export class UserMeProfileResponseDto {
  subject!: string;
  email!: string;
  name!: string;
  status!: string;
}

export class UserMeServiceRolesResponseDto {
  subject!: string;
  service!: {
    key: string;
    name: string;
  };
  roles!: string[];
}
