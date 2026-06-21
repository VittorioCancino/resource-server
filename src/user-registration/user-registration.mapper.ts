import {
  RegistrationInvitationResponseDto,
  RegistrationLaboratoryResponseDto,
  RegistrationServiceResponseDto,
  RegistrationUserResponseDto,
} from './dto/user-registration.dto';

interface InvitationLaboratory {
  id: string;
  code: string;
  name: string;
}

interface InvitationService {
  id: string;
  key: string;
  name: string;
  type: string;
  laboratory: InvitationLaboratory | null;
}

interface InvitationUser {
  id: string;
  subject: string;
  email: string;
  name: string;
  status: string;
}

interface InvitationWithRelations {
  id: string;
  code: string;
  status: string;
  createdAt: Date;
  registeredAt: Date | null;
  approvedAt: Date | null;
  createdBySubject: string | null;
  createdByClientId: string | null;
  service: InvitationService;
  registeredUser: InvitationUser | null;
}

export function toRegistrationLaboratoryResponse(
  laboratory: InvitationLaboratory,
): RegistrationLaboratoryResponseDto {
  return {
    id: laboratory.id,
    code: laboratory.code,
    name: laboratory.name,
  };
}

export function toRegistrationServiceResponse(
  service: InvitationService,
): RegistrationServiceResponseDto {
  return {
    id: service.id,
    key: service.key,
    name: service.name,
    type: service.type,
  };
}

function toRegistrationUserResponse(
  user: InvitationUser,
): RegistrationUserResponseDto {
  return {
    id: user.id,
    subject: user.subject,
    email: user.email,
    name: user.name,
    status: user.status,
  };
}

export function toRegistrationInvitationResponse(
  invitation: InvitationWithRelations,
): RegistrationInvitationResponseDto {
  return {
    id: invitation.id,
    code: invitation.code,
    status: invitation.status,
    createdAt: invitation.createdAt,
    registeredAt: invitation.registeredAt,
    approvedAt: invitation.approvedAt,
    createdBySubject: invitation.createdBySubject,
    createdByClientId: invitation.createdByClientId,
    service: toRegistrationServiceResponse(invitation.service),
    laboratory: invitation.service.laboratory
      ? toRegistrationLaboratoryResponse(invitation.service.laboratory)
      : null,
    registeredUser: invitation.registeredUser
      ? toRegistrationUserResponse(invitation.registeredUser)
      : null,
  };
}
