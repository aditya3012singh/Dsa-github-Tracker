export const calculateOverallScore = (stats: any) => {
  if (!stats) return 0;
  return stats.totalSolved || 0;
};
