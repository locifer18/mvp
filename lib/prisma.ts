import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// 1. Define the global type to prevent multiple instances in development
type PrismaClientSingleton = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientSingleton | undefined;
};

/**
 * Create Prisma client with proper configuration
 * Reuses instance in development to avoid "too many connections" errors
 */
const createPrismaClient = () => {
    const connectionString = process.env.DATABASE_URL;

    // Use the driver adapter for better performance in serverless/edge environments
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    return new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === "development"
            ? ["error", "warn"]
            : ["error"],
    });
};

// 3. Export the singleton instance
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// 4. In development, save the instance to globalThis
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}


/**
 * Disconnect Prisma client
 * Call this on app shutdown
 */
export async function disconnectDB() {
    try {
        await prisma.$disconnect();
        console.log('Database disconnected');
    } catch (error) {
        console.error('Failed to disconnect database:', error);
    }
}

export default prisma;