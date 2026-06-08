import { Prisma } from '../../../generated/prisma/client';

export type DbError =
  | {
      kind: 'prisma-known';
      error: Prisma.PrismaClientKnownRequestError;
    }
  | {
      kind: 'unknown';
      error: unknown;
    };

export type DbResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: DbError;
    };

export function dbErrorFromUnknown(error: unknown): DbError {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return {
      kind: 'prisma-known',
      error,
    };
  }

  return {
    kind: 'unknown',
    error,
  };
}

export async function safeDbCall<T>(
  fn: () => Promise<T>,
): Promise<DbResult<T>> {
  try {
    return {
      ok: true,
      data: await fn(),
    };
  } catch (error) {
    return {
      ok: false,
      error: dbErrorFromUnknown(error),
    };
  }
}
