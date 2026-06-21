export const RESOURCE_SERVER_AUDIENCE = 'resource-server';

export const RESOURCE_SERVER_SCOPES = {
  INTERNAL_AUTH_VERIFY_CREDENTIALS: 'internal.auth.verify-credentials',
  LABS_READ: 'labs.read',
  LABS_SELF_DEREGISTER: 'labs.self-deregister',
  LABS_SELF_UPDATE: 'labs.self-update',
  USER_REGISTRATION_CODES_VALIDATE: 'user-registration.codes.validate',
  USER_REGISTRATION_INVITATIONS_APPROVE:
    'user-registration.invitations.approve',
  USER_REGISTRATION_INVITATIONS_DELETE: 'user-registration.invitations.delete',
  USER_REGISTRATION_INVITATIONS_READ: 'user-registration.invitations.read',
  USER_REGISTRATION_INVITATIONS_WRITE: 'user-registration.invitations.write',
  USER_REGISTRATION_REGISTRATIONS_WRITE:
    'user-registration.registrations.write',
  USERS_DELETE: 'users.delete',
  USERS_ME_PROFILE_READ: 'users.me.profile.read',
  USERS_ME_SERVICE_ROLES_READ: 'users.me.services.:serviceKey.roles.read',
  USERS_READ: 'users.read',
  USERS_WRITE: 'users.write',
} as const;
