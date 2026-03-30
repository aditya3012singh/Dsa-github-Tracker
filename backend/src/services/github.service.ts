import axios from 'axios';

export const githubService = async (handle: string) => {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  // 1. Get basic stats from GitHub REST API
  const restUrl = `https://api.github.com/users/${handle}`;
  const restResponse = await axios.get(restUrl, { headers });
  
  const githubRepos = restResponse.data.public_repos || 0;
  const githubFollowers = restResponse.data.followers || 0;
  const githubFollowing = restResponse.data.following || 0;

  // 2. Get contributions from community API (or GraphQL if token exists)
  // For now, using community API to avoid complex GraphQL setup without verified token
  let contributions = 0;
  try {
    const contribsUrl = `https://github-contributions-api.jogruber.de/v4/${handle}`;
    const contribsResponse = await axios.get(contribsUrl);
    contributions = contribsResponse.data.total?.lastYear || contribsResponse.data.total?.thisYear || 0;
  } catch (err) {
    console.error(`[GitHub] Failed to fetch contributions for ${handle}:`, err);
  }

  return { 
    githubContributions: contributions,
    githubRepos,
    githubFollowers,
    githubFollowing
  };
};
