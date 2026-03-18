import { fetchHtml } from '../utils/scraper';

export const codechefService = async (handle: string) => {
  const url = `https://www.codechef.com/users/${handle}`;
  console.log(`[CodeChef] Scraping URL: ${url}`);
  const $ = await fetchHtml(url);
  
  // Rating extraction
  const ratingText = $('.rating-number').text();
  console.log(`[CodeChef] Rating text found: "${ratingText}"`);
  const rating = parseInt(ratingText, 10) || 0;

  // Total Problems Solved extraction
  const solvedHeaderText = $('section.rating-data-section.problems-solved h3').text();
  console.log(`[CodeChef] Solved header text found: "${solvedHeaderText}"`);
  const solvedMatch = solvedHeaderText.match(/Total Problems Solved:\s*(\d+)/i);
  const solvedCount = solvedMatch ? parseInt(solvedMatch[1], 10) : 0;

  console.log(`[CodeChef] Final stats for ${handle}: Rating=${rating}, Solved=${solvedCount}`);
  return {
    codechefRating: rating,
    codechefSolved: solvedCount
  };
};
