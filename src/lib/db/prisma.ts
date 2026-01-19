/**
 * Prisma Database Client
 *
 * This file sets up and exports a singleton Prisma client instance for database operations.
 * Uses the PostgreSQL adapter for Neon serverless database compatibility.
 *
 * Features:
 * - Singleton pattern to prevent multiple client instances in development (hot reload)
 * - Lazy initialization with PostgreSQL adapter
 * - Error logging enabled
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client
 */

import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

// Global singleton to persist across hot reloads in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Creates a new Prisma client with PostgreSQL adapter
 * @returns Configured PrismaClient instance
 */
function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });

  return new PrismaClient({
    adapter,
    log: ["error"],
  });
}

// Export singleton instance
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Preserve instance across hot reloads in development
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
