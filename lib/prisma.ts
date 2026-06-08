import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const connectionString = `${process.env.DATABASE_URL}`;

const prismaPg = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter: prismaPg });

export { prisma };
