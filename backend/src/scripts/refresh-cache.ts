import { redisConnection } from '../config/redis';
import { logger } from '../utils/logger';

async function verifyCache() {
  try {
    // 1. Check current version
    const version = await redisConnection.get('leaderboard:version');
    console.log(`Current Cache Version: ${version}`);

    // 2. Increment version to invalidate all stale caches
    const newVersion = await redisConnection.incr('leaderboard:version');
    console.log(`New Cache Version: ${newVersion}`);

    // 3. Inspect Redis Ranks ZSET
    const totalRanks = await redisConnection.zcard('leaderboard_ranks');
    console.log(`Total entries in leaderboard_ranks ZSET: ${totalRanks}`);

    // 4. Find Vanshika's score in ZSET if she exists
    // We need her UUID, let's find it first or use a pattern search
    // Since we don't have the ID easily, let's just clear the ZSET and let it rebuild if it's used
    // Actually, looking at the code, the ZSET is used for CURRENT USER rank, not the main list.
    // The main list comes from DB or Cache.
    
    // Clear the main list cache prefix
    // (We already did this by incrementing the version)

    console.log('Cache version incremented. Main leaderboard list should now refresh from DB.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

verifyCache();
