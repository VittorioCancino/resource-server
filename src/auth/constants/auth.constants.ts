export const RESOURCE_SERVER_AUDIENCE = 'resource-server';

export const RESOURCE_SERVER_SCOPES = {
  LABS_READ: 'labs.read',
  LABS_SELF_DEREGISTER: 'labs.self-deregister',
  LABS_SELF_UPDATE: 'labs.self-update',
  USERS_DELETE: 'users.delete',
  USERS_READ: 'users.read',
  USERS_WRITE: 'users.write',
} as const;
