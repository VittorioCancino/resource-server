import {
  UserDetailResponseDto,
  UserListItemResponseDto,
  UserServiceDetailResponseDto,
  UserServiceSummaryResponseDto,
} from './dto/user-list.dto';

interface UserLaboratoryPayload {
  id: string;
  clientId: string;
  code: string;
  name: string;
  location: string | null;
  timezone: string;
  isActive: boolean;
}

interface UserServicePayload {
  id: string;
  key: string;
  name: string;
  type: string;
  laboratory: UserLaboratoryPayload | null;
}

interface UserServiceMembershipPayload {
  service: UserServicePayload;
  roles: {
    serviceRole: {
      name: string;
    };
  }[];
}

export interface UserWithServicesPayload {
  id: string;
  subject: string;
  name: string;
  email: string;
  status: string;
  serviceMemberships: UserServiceMembershipPayload[];
}

function getSortedRoles(membership: UserServiceMembershipPayload): string[] {
  return membership.roles
    .map((membershipRole) => membershipRole.serviceRole.name)
    .sort((left, right) => left.localeCompare(right));
}

function toUserServiceSummary(
  membership: UserServiceMembershipPayload,
): UserServiceSummaryResponseDto {
  return {
    id: membership.service.id,
    key: membership.service.key,
    name: membership.service.name,
    type: membership.service.type,
    roles: getSortedRoles(membership),
  };
}

function toUserServiceDetail(
  membership: UserServiceMembershipPayload,
): UserServiceDetailResponseDto {
  return {
    ...toUserServiceSummary(membership),
    laboratory: membership.service.laboratory,
  };
}

export function toUserListItemResponse(
  user: UserWithServicesPayload,
): UserListItemResponseDto {
  return {
    id: user.id,
    subject: user.subject,
    name: user.name,
    email: user.email,
    status: user.status,
    services: user.serviceMemberships
      .map(toUserServiceSummary)
      .sort((left, right) => left.key.localeCompare(right.key)),
  };
}

export function toUserDetailResponse(
  user: UserWithServicesPayload,
): UserDetailResponseDto {
  return {
    id: user.id,
    subject: user.subject,
    name: user.name,
    email: user.email,
    status: user.status,
    services: user.serviceMemberships
      .map(toUserServiceDetail)
      .sort((left, right) => left.key.localeCompare(right.key)),
  };
}
