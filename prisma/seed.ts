import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import {
  normalizeEmail,
  subjectFromEmail,
} from '../src/common/identity/user-identity.util';
import { hashPassword } from '../src/common/security/password-hash.util';
import {
  servicesSeedData,
  userServiceRolesSeedData,
  usersSeedData,
} from './seed-data';

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  const prisma = new PrismaClient({ adapter });

  try {
    for (const seededUser of usersSeedData) {
      const email = normalizeEmail(seededUser.email);
      const subject = subjectFromEmail(email);
      const passwordHash = await hashPassword(seededUser.password);
      const user = await prisma.user.upsert({
        where: { email },
        update: {
          name: seededUser.name,
          subject,
        },
        create: {
          email,
          name: seededUser.name,
          subject,
        },
      });

      await prisma.userCredential.upsert({
        where: { userId: user.id },
        update: { passwordHash },
        create: {
          userId: user.id,
          passwordHash,
        },
      });
    }

    for (const seededService of servicesSeedData) {
      const service = await prisma.service.upsert({
        where: { key: seededService.key },
        update: { name: seededService.name },
        create: {
          key: seededService.key,
          name: seededService.name,
        },
      });

      for (const seededRole of seededService.roles) {
        await prisma.serviceRole.upsert({
          where: {
            serviceId_name: {
              serviceId: service.id,
              name: seededRole.name,
            },
          },
          update: {},
          create: {
            serviceId: service.id,
            name: seededRole.name,
          },
        });
      }
    }

    for (const seededUserServiceRole of userServiceRolesSeedData) {
      const email = normalizeEmail(seededUserServiceRole.email);
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      const serviceRole = await prisma.serviceRole.findFirst({
        where: {
          name: seededUserServiceRole.roleName,
          service: {
            key: seededUserServiceRole.serviceKey,
          },
        },
        select: { id: true, serviceId: true },
      });

      if (!user || !serviceRole) {
        throw new Error(
          `Unable to seed service role ${seededUserServiceRole.serviceKey}/${seededUserServiceRole.roleName} for ${email}`,
        );
      }

      await prisma.userServiceMembership.upsert({
        where: {
          userId_serviceId: {
            userId: user.id,
            serviceId: serviceRole.serviceId,
          },
        },
        update: {},
        create: {
          userId: user.id,
          serviceId: serviceRole.serviceId,
        },
      });

      await prisma.userServiceMembershipRole.upsert({
        where: {
          userId_serviceId_serviceRoleId: {
            userId: user.id,
            serviceId: serviceRole.serviceId,
            serviceRoleId: serviceRole.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          serviceId: serviceRole.serviceId,
          serviceRoleId: serviceRole.id,
        },
      });
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('Failed to seed database');
  console.error(error);
  process.exit(1);
});
