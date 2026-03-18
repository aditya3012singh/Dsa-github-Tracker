import fs from 'fs';
import path from 'path';

const RAW_FILE = path.join(__dirname, '../data/raw_data.tsv');
const OUTPUT_FILE = path.join(__dirname, '../data/students.json');

function cleanHandle(handle: string | undefined): string | null {
  if (!handle) return null;
  
  let cleaned = handle.trim().replace(/^="/, '').replace(/"$/, '');
  
  // Ignore placeholders
  const placeholders = ['na', 'n/a', '.', 'none', '-', 'not applicable', 'null', 'nan'];
  if (placeholders.includes(cleaned.toLowerCase())) return null;

  // Extract from URLs
  try {
    if (cleaned.includes('leetcode.com/u/')) {
      return cleaned.split('leetcode.com/u/')[1].split('/')[0];
    }
    if (cleaned.includes('geeksforgeeks.org/profile/')) {
      return cleaned.split('geeksforgeeks.org/profile/')[1].split('/')[0];
    }
    if (cleaned.includes('codechef.com/users/')) {
      return cleaned.split('codechef.com/users/')[1].split('/')[0];
    }
    if (cleaned.includes('codeforces.com/profile/')) {
      return cleaned.split('codeforces.com/profile/')[1].split('/')[0];
    }
    if (cleaned.includes('github.com/')) {
      return cleaned.split('github.com/')[1].split('/')[0];
    }
  } catch (e) {
    // Fallback to original if URL parsing fails
  }

  // Final cleanup: remove @ if it's there
  if (cleaned.startsWith('@')) cleaned = cleaned.substring(1);

  return cleaned || null;
}

function parseYear(yearStr: string): number {
  const match = yearStr.match(/\d+/);
  return match ? parseInt(match[0]) : 1;
}

async function main() {
  if (!fs.existsSync(RAW_FILE)) {
    console.error(`Error: ${RAW_FILE} not found.`);
    return;
  }

  const content = fs.readFileSync(RAW_FILE, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  
  // Headers are in the first line
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t').map(c => c.trim().replace(/^="/, '').replace(/"$/, ''));
    
    if (cols.length < 15) continue;

    const student = {
      name: cols[2],             // Student Name
      rollNo: cols[3] || cols[1],// Library ID (fallback to Uni Roll)
      branch: cols[6],           // Branch
      year: parseYear(cols[4]),  // Year
      leetcodeHandle: cleanHandle(cols[11]),
      codechefHandle: cleanHandle(cols[12]),
      codeforcesHandle: cleanHandle(cols[13]),
      gfgHandle: cleanHandle(cols[14]),
      githubHandle: cleanHandle(cols[15]),
    };

    data.push(student);
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
  console.log(`Successfully parsed ${data.length} students to ${OUTPUT_FILE}`);
}

main().catch(console.error);
