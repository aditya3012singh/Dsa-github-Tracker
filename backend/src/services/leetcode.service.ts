import axios from 'axios';
import { logger } from '../utils/logger';

export const leetcodeService = async (handle: string) => {
  const query = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        submitStats {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
    }
  `;

  try {
    const proxyUrl = process.env.PROXY_URL;
    const axiosConfig: any = { timeout: 10000 };

    if (proxyUrl) {
      try {
        const url = new URL(proxyUrl);
        axiosConfig.proxy = {
          protocol: url.protocol.replace(':', ''),
          host: url.hostname,
          port: parseInt(url.port),
          auth: url.username ? { username: url.username, password: url.password } : undefined
        };
      } catch (e) {
        logger.error(`Invalid PROXY_URL: ${proxyUrl}`);
      }
    }

    const response = await axios.post('https://leetcode.com/graphql', {
      query,
      variables: { username: handle }
    }, axiosConfig);

    if (response.data.errors) {
      const errorMsg = response.data.errors[0]?.message || 'Unknown GraphQL error';
      logger.error(`LeetCode GraphQL error for ${handle}: ${errorMsg}`);
      throw new Error(`LeetCode GraphQL error: ${errorMsg}`);
    }

    const stats = response.data.data.matchedUser;
    if (!stats) {
      logger.warn(`LeetCode user not found: ${handle}`);
      throw new Error('LeetCode user not found');
    }

    const submissions = stats.submitStats.acSubmissionNum;
    
    const all = submissions.find((s: any) => s.difficulty === 'All')?.count || 0;
    const easy = submissions.find((s: any) => s.difficulty === 'Easy')?.count || 0;
    const medium = submissions.find((s: any) => s.difficulty === 'Medium')?.count || 0;
    const hard = submissions.find((s: any) => s.difficulty === 'Hard')?.count || 0;

    return {
      leetcodeSolved: all,
      leetcodeEasy: easy,
      leetcodeMedium: medium,
      leetcodeHard: hard
    };
  } catch (error: any) {
    logger.error(`LeetCode service error for ${handle}: ${error.message}`);
    throw error;
  }
};
