import { redisConnection, redisSubscriber } from '../config/redis';
import { logger } from './logger';

type EventHandler = (data: any) => void | Promise<void>;

const handlers: Record<string, EventHandler[]> = {};
let isListening = false;

/**
 * Publish an event message to a Redis Pub/Sub channel.
 */
export const publishEvent = async (channel: string, data: any) => {
  try {
    await redisConnection.publish(channel, JSON.stringify(data));
  } catch (error) {
    logger.error(`Failed to publish event to channel ${channel}:`, error);
  }
};

/**
 * Subscribe to a Redis Pub/Sub channel with a handler function.
 */
export const subscribeEvent = async (channel: string, handler: EventHandler) => {
  if (!handlers[channel]) {
    handlers[channel] = [];
    try {
      await redisSubscriber.subscribe(channel);
      logger.info(`Subscribed to Redis channel: ${channel}`);
    } catch (error) {
      logger.error(`Failed to subscribe to channel ${channel}:`, error);
    }
  }
  
  handlers[channel].push(handler);

  if (!isListening) {
    isListening = true;
    redisSubscriber.on('message', async (chan, message) => {
      const chanHandlers = handlers[chan];
      if (chanHandlers && chanHandlers.length > 0) {
        try {
          const parsedData = JSON.parse(message);
          for (const h of chanHandlers) {
            try {
              await h(parsedData);
            } catch (err: any) {
              logger.error(`Error in event handler for channel ${chan}:`, err);
            }
          }
        } catch (err: any) {
          logger.error(`Failed to parse event message on channel ${chan}:`, err);
        }
      }
    });
  }
};
