export const calculateOverallScore = (stats: any) => {
  if (!stats) return 0;
  
  const score =
    ((stats.leetcodeSolved || 0) * 1) +
    ((stats.codeforcesRating || 0) * 0.4) +
    ((stats.codechefRating || 0) * 0.3) +
    ((stats.codechefSolved || 0) * 0.7) +
    ((stats.gfgSolved || 0) * 0.5) +
    ((stats.githubContributions || 0) * 0.2);
    
  return parseFloat(score.toFixed(2));
};
