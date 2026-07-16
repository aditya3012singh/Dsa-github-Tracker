import { PrismaClient } from '@prisma/client';
import { logger } from '../observability/logger/logger';
import { metrics } from '../observability/metrics/metrics';

const SLOW_QUERY_THRESHOLD_SECONDS = Number(process.env.PRISMA_SLOW_QUERY_THRESHOLD_MS ?? 300) / 1000;

const basePrisma = new PrismaClient();

export const prisma = basePrisma.$extends({
    query: {
        $allModels: {
            async $allOperations({ model, operation, args, query }) {
                const modelName = model || "unknown";
                const start = process.hrtime.bigint();
                let success = false;
                
                try {
                    const result = await query(args);
                    success = true;
                    return result;
                } catch (error) {
                    logger.error("Prisma Query Failed", {
                        model: modelName,
                        operation,
                        error
                    });
                    throw error;
                } finally {
                    const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
                    
                    metrics.prisma.recordDuration(modelName, operation, durationSeconds);
                    metrics.prisma.recordQuery(modelName, operation, success ? "success" : "error");
                    
                    if (!success) {
                        metrics.prisma.recordError(modelName, operation);
                    }
                    
                    if (durationSeconds > SLOW_QUERY_THRESHOLD_SECONDS) {
                        metrics.prisma.recordSlowQuery(modelName, operation);
                        logger.warn("Slow Prisma Query", {
                            model: modelName,
                            operation,
                            duration_ms: durationSeconds * 1000,
                            status: "slow"
                        });
                    }
                }
            }
        }
    }
});

basePrisma.$connect()
  .then(() => {
    logger.info('Successfully connected to Postgres database via Prisma.');
  })
  .catch((err: any) => {
    logger.error('Prisma Connection Failed', { error: err });
  });
