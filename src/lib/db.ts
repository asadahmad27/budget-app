import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaConnectPromise: Promise<void> | undefined;
};

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

async function connectWithRetry(client: PrismaClient, attempts = 3) {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      await client.$connect();
      return;
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
      }
    }
  }

  throw lastError;
}

export async function ensureDbConnection() {
  if (!globalForPrisma.prismaConnectPromise) {
    globalForPrisma.prismaConnectPromise = connectWithRetry(db).catch((error) => {
      globalForPrisma.prismaConnectPromise = undefined;
      throw error;
    });
  }

  return globalForPrisma.prismaConnectPromise;
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
