import {
  MaintainerAccountResponseDto,
  ServiceSelfResponseDto,
} from './dto/service-self-registration.dto';

interface ServiceWithRolesPayload {
  id: string;
  clientId: string;
  name: string;
  type: string;
  roles: {
    name: string;
  }[];
}

export function toServiceSelfResponse(
  service: ServiceWithRolesPayload,
): ServiceSelfResponseDto {
  return {
    id: service.id,
    clientId: service.clientId,
    name: service.name,
    type: service.type,
    roles: service.roles
      .map((role) => role.name)
      .sort((left, right) => left.localeCompare(right)),
  };
}

interface MaintainerAccountPayload {
  id: string;
  subject: string;
  email: string;
  name: string;
  service: {
    id: string;
    clientId: string;
    name: string;
    type: string;
  };
}

export function toMaintainerAccountResponse(
  account: MaintainerAccountPayload,
  action: 'created' | 'updated',
): MaintainerAccountResponseDto {
  return {
    id: account.id,
    subject: account.subject,
    email: account.email,
    name: account.name,
    service: account.service,
    action,
  };
}
