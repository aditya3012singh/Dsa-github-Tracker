import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const tsvPath = path.join(__dirname, '../data/raw_data.tsv');
  
  if (!fs.existsSync(tsvPath)) {
    console.error('Error: raw_data.tsv not found in src/data/');
    return;
  }

  const fileContent = fs.readFileSync(tsvPath, 'utf-8');
  const lines = fileContent.split('\n').filter(line => line.trim() !== '');
  
  // Skip header
  const dataLines = lines.slice(1);
  console.log(`Found ${dataLines.length} students in TSV to seed.`);

  const hashedPassword = await bcrypt.hash('password123', 10);

  let successCount = 0;
  let skipCount = 0;

  for (const line of dataLines) {
    // Split by tab, removing the ="..." wrapper
    const cols = line.split('\t').map(col => {
      let val = col.trim();
      if (val.startsWith('="')) val = val.substring(2);
      if (val.endsWith('"')) val = val.substring(0, val.length - 1);
      return val.trim();
    });

    if (cols.length < 16) continue;

    const [
      timestamp,
      uniRollNo,
      name,
      libraryIdInput, 
      yearStr,
      gender,
      branch,
      section,
      email,
      personalEmail,
      contact,
      leetcode,
      codechef,
      codeforces,
      gfg,
      github
    ] = cols;

    // Helper to extract username from URL if present
    const cleanHandle = (handle: string) => {
      if (!handle || handle.toLowerCase() === 'na' || handle === '.' || handle === '-' || handle === '..') return null;
      // If it's a URL, get the last segment
      if (handle.includes('/')) {
        const parts = handle.split('/').filter(p => p.trim() !== '');
        if (parts.length > 0) {
          const last = parts[parts.length - 1];
          // If it ends with profile/ we might need second to last
          if (last === 'profile' && parts.length > 1) return parts[parts.length - 2];
          return last;
        }
      }
      return handle;
    };

    const year = parseInt(yearStr.replace(/\D/g, ''), 10) || 1;

    // SKIP 1st YEAR STUDENTS
    if (year === 1) {
      skipCount++;
      continue;
    }
    
    // Normalize Library ID
    const normalizeLibraryId = (id: string): string => {
      if (!id) return '';
      return id
        .replace(/\(AI&ML\)/gi, 'AIML')
        .replace(/\(AI\)/gi, 'AI')
        .replace(/\(ML\)/gi, 'ML')
        .replace(/[()&]/g, '') 
        .replace(/\s+/g, '')   
        .toUpperCase();
    };

    const libraryId = normalizeLibraryId(libraryIdInput);

    try {
      if (!libraryId) {
        console.warn(`Skipping student with missing Library ID: ${name}`);
        skipCount++;
        continue;
      }

      await prisma.student.upsert({
        where: { libraryId: libraryId },
        update: {
          name: name,
          email: cleanHandle(email),
          section: cleanHandle(section),
          leetcodeHandle: cleanHandle(leetcode),
          codeforcesHandle: cleanHandle(codeforces),
          gfgHandle: cleanHandle(gfg),
          codechefHandle: cleanHandle(codechef),
          githubHandle: cleanHandle(github),
          branch: branch,
          year: year,
          // rollNo remains as is or set to null if it was the messy one
        },
        create: {
          name: name,
          libraryId: libraryId,
          rollNo: null, // User said "make that field empty"
          email: cleanHandle(email),
          branch: branch,
          year: year,
          section: cleanHandle(section),
          leetcodeHandle: cleanHandle(leetcode),
          codeforcesHandle: cleanHandle(codeforces),
          gfgHandle: cleanHandle(gfg),
          codechefHandle: cleanHandle(codechef),
          githubHandle: cleanHandle(github),
          password: hashedPassword,
        },
      });
      successCount++;
      if (successCount % 50 === 0) console.log(`Processed ${successCount} students...`);
    } catch (error) {
      console.error(`Failed to seed student ${libraryId} (${name}):`, error);
      skipCount++;
    }
  }

  console.log('--- Full Seeding Completed ---');
  console.log(`Successfully seeded/updated: ${successCount}`);
  console.log(`Errors: ${skipCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
