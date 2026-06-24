import {
  UserDetailResponseDto,
  UserListItemResponseDto,
  UserServiceSummaryResponseDto,
} from './dto/user-list.dto';

interface UserServicePayload {
  id: string;
  clientId: string;
  name: string;
  type: string;
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
    clientId: membership.service.clientId,
    name: membership.service.name,
    type: membership.service.type,
    roles: getSortedRoles(membership),
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
      .sort((left, right) => left.clientId.localeCompare(right.clientId)),
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
      .map(toUserServiceSummary)
      .sort((left, right) => left.clientId.localeCompare(right.clientId)),
  };
}
