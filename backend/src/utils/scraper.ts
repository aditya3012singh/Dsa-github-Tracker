import axios from 'axios';
import * as cheerio from 'cheerio';
import { logger } from './logger';

export const fetchHtml = async (url: string, render: boolean = false) => {
  const singleKey = process.env.PROXY_API_KEY;
  const multiKeys = process.env.PROXY_API_KEYS;

  // Build ordered list of keys to try
  let keys: string[] = [];
  if (multiKeys) {
    keys = multiKeys.split(',').map(k => k.trim()).filter(Boolean);
  }
  if (keys.length === 0 && singleKey) {
    keys = [singleKey];
  }

  const retryableStatuses = new Set([403, 429, 499, 500, 503]);

  // Try each key in sequence, falling back on proxy errors
  for (let i = 0; i < Math.max(keys.length, 1); i++) {
    const apiKey = keys[i] ?? null;
    const targetUrl = apiKey
      ? `http://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(url)}${render ? '&render=true' : ''}`
      : url;

    try {
      const response = await axios.get(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
        timeout: apiKey ? 60000 : 10000,
      });
      return cheerio.load(response.data);
    } catch (error: any) {
      const status = error.response?.status;
      const isLast = i === keys.length - 1;
      if (retryableStatuses.has(status) && !isLast) {
        logger.warn(`Proxy key #${i + 1} failed (${status}) for ${url}, trying next key...`);
        continue;
      }
      logger.error(`Error scraping ${url} (via ${apiKey ? 'proxy' : 'direct'}):`, error.message);
      throw error;
    }
  }

  throw new Error(`All proxy keys failed for ${url}`);
};
