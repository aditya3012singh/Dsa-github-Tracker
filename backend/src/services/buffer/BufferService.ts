import { redisConnection } from '../../config/redis';

export class BufferService {
    async enqueue(queueName: string, data: any): Promise<void> {
        const packet = JSON.stringify(data);
        await redisConnection.lpush(queueName, packet);
    }
}

export const bufferService = new BufferService();
