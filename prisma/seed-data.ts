function requiredSeedEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required to seed database users`);
  }

  return value;
}

const adminSeedEmail = requiredSeedEnv('SEED_ADMIN_EMAIL');
const standardSeedEmail = requiredSeedEnv('SEED_USER_EMAIL');

export const usersSeedData = [
  {
    email: adminSeedEmail,
    name: requiredSeedEnv('SEED_ADMIN_NAME'),
    password: requiredSeedEnv('SEED_ADMIN_PASSWORD'),
  },
  {
    email: standardSeedEmail,
    name: requiredSeedEnv('SEED_USER_NAME'),
    password: requiredSeedEnv('SEED_USER_PASSWORD'),
  },
];

export const servicesSeedData = [
  {
    key: 'hydra',
    name: 'Hydra',
    roles: [{ name: 'admin' }, { name: 'user' }],
  },
  {
    key: 'user-portal',
    name: 'User Portal',
    roles: [{ name: 'admin' }, { name: 'user' }],
  },
];

export const userServiceRolesSeedData = [
  {
    email: adminSeedEmail,
    serviceKey: 'hydra',
    roleName: 'admin',
  },
  {
    email: adminSeedEmail,
    serviceKey: 'user-portal',
    roleName: 'admin',
  },
  {
    email: standardSeedEmail,
    serviceKey: 'hydra',
    roleName: 'user',
  },
  {
    email: standardSeedEmail,
    serviceKey: 'user-portal',
    roleName: 'user',
  },
];
