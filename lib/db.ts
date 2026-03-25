import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function makeClient(): PrismaClient {
  // Production: use Turso via libSQL adapter
  if (process.env.TURSO_DATABASE_URL) {
    const libsql = createClient({
      url:       process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    const adapter = new PrismaLibSql(libsql);
    return new PrismaClient({ adapter } as any);
  }
  // Development: use local SQLite file via DATABASE_URL
  return new PrismaClient();
}

export const db = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
