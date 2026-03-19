import axios from 'axios';
import * as cheerio from 'cheerio';
import { logger } from './logger';

export const fetchHtml = async (url: string) => {
  const singleKey = process.env.PROXY_API_KEY;
  const multiKeys = process.env.PROXY_API_KEYS;
  
  let apiKey = singleKey;

  // Support for multiple comma-separated keys (random rotation)
  if (multiKeys) {
    const keys = multiKeys.split(',').map(k => k.trim()).filter(Boolean);
    if (keys.length > 0) {
      apiKey = keys[Math.floor(Math.random() * keys.length)];
    }
  }

  let targetUrl = url;
  
  // If API key is provided, route through ScraperAPI
  if (apiKey) {
    targetUrl = `http://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(url)}`;
  }

  try {
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: apiKey ? 60000 : 10000, // Proxies can be slower, so we increase timeout
    });
    return cheerio.load(response.data);
  } catch (error: any) {
    logger.error(`Error scraping ${url} (via ${apiKey ? 'proxy' : 'direct'}):`, error.message);
    throw error;
  }
};
