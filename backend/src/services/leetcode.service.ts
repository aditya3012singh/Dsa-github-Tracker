import axios from 'axios';

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

  const response = await axios.post('https://leetcode.com/graphql', {
    query,
    variables: { username: handle }
  });

  const stats = response.data.data.matchedUser;
  if (!stats) throw new Error('LeetCode user not found');

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
};
