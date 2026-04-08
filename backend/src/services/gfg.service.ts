import axios from 'axios';
import { logger } from '../utils/logger';

export const gfgService = async (handle: string) => {
  const apiUrl = `https://practiceapi.geeksforgeeks.org/api/v1/user/problems/submissions/`;
  
  try {
    const response = await axios.post(apiUrl, {
      handle: handle,
      requestType: "",
      year: "",
      month: ""
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://www.geeksforgeeks.org',
        'Referer': 'https://www.geeksforgeeks.org/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (response.data && typeof response.data.count !== 'undefined') {
      const solved = parseInt(response.data.count, 10) || 0;
      return { gfgSolved: solved };
    }
    
    logger.warn(`GFG API response for ${handle} missing count: ${JSON.stringify(response.data)}`);
  } catch (error: any) {
    logger.error(`GFG service error for ${handle}: ${error.message}`);
  }

  return { gfgSolved: 0 };
};
