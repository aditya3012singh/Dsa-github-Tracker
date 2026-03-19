import axios from 'axios';

export const codeforcesService = async (handle: string) => {
  try {
    const response = await axios.get(`https://codeforces.com/api/user.info?handles=${handle}`);
    
    if (response.data.status !== 'OK') {
      throw new Error('Codeforces API failed');
    }

    const user = response.data.result[0];

    return {
      codeforcesRating: user.rating || 0,
      codeforcesMaxRating: user.maxRating || 0,
    };
  } catch (error: any) {
    if (error.response?.status === 400) {
      throw new Error('Codeforces user not found');
    }
    throw error;
  }
};
