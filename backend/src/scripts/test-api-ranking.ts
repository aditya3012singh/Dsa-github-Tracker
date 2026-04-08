import axios from 'axios';

async function testApi() {
  try {
    const baseUrl = 'http://localhost:3000/api/leaderboard';
    const params = {
      page: 1,
      limit: 100,
      sortBy: 'totalSolved',
      order: 'desc',
      year: 'All',
      branch: 'All',
      section: 'All'
    };

    console.log('--- FETCHING LEADERBOARD API ---');
    const response = await axios.get(baseUrl, { params });
    const data = response.data;

    console.log(`Source: ${data.source}`);
    console.log(`Total: ${data.total}`);
    console.log(`Top 5 Students in Response:`);
    
    data.data.slice(0, 5).forEach((s: any, i: number) => {
      console.log(`${i+1}. ${s.name} - Total: ${s.totalSolved}, RankChange: ${s.rankChange}`);
    });

  } catch (err) {
    console.error('API call failed. Is the server running?');
  }
}

testApi();
