import { fetchHtml } from '../utils/scraper';

export const githubService = async (handle: string) => {
  // Main profile for repos/followers
  const $profile = await fetchHtml(`https://github.com/${handle}`);
  
  // Separate contributions page for accuracy
  const $contribs = await fetchHtml(`https://github.com/users/${handle}/contributions`);
  
  // Contributions count
  const contributionText = $contribs('h2').first().text().trim();
  const rawContribs = contributionText.match(/(\d+)/);
  const contributions = rawContribs ? parseInt(rawContribs[1], 10) : 0;

  // Repository count
  const reposText = $profile('a[href*="tab=repositories"] span.Counter').first().text().trim();
  const githubRepos = parseInt(reposText, 10) || 0;

  // Followers count
  const followersText = $profile('a[href*="tab=followers"] span.text-bold').first().text().trim();
  const githubFollowers = parseInt(followersText, 10) || 0;

  // Following count
  const followingText = $profile('a[href*="tab=following"] span.text-bold').first().text().trim();
  const githubFollowing = parseInt(followingText, 10) || 0;

  return { 
    githubContributions: contributions,
    githubRepos,
    githubFollowers,
    githubFollowing
  };
};
