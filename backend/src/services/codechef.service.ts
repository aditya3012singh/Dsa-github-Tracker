import axios from 'axios';

export const codechefService = async (handle: string) => {
  const url = `https://codechef-api.vercel.app/${handle}`;
  
  try {
    const response = await axios.get(url);
    const data = response.data;

    // The API might return status: 'Failed' or 404
    if (data.status === 'Failed' || !data.currentRating) {
      return {
        codechefRating: 0,
        codechefSolved: 0
      };
    }

    return {
      codechefRating: data.currentRating || 0,
      codechefSolved: data.problemsSolved || 0
    };
  } catch (error: any) {
    console.error(`[CodeChef] API error for ${handle}:`, error.message);
    return {
      codechefRating: 0,
      codechefSolved: 0
    };
  }
};
