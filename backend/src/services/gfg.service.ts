import axios from 'axios';

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
  } catch (error: any) {
    // Silently fail or log to a proper logger if needed, but return 0
  }

  return { gfgSolved: 0 };
};
