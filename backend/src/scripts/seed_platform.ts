import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function normalizeLibraryId(id: string): string {
  if (!id) return '';
  // Convert to uppercase and remove spaces/parentheses/special characters
  // e.g. 2428CSE(AI&ML)1029 -> 2428CSEAIML1029
  return id.toUpperCase()
    .replace(/\s+/g, '')
    .replace(/\(/g, '')
    .replace(/\)/g, '')
    .replace(/&/g, '')
    .trim();
}

function cleanHandle(handle: string): string | null {
  if (!handle) return null;
  const h = handle.trim();
  
  // Check for common "NA" placeholders
  const lowerH = h.toLowerCase();
  if (
    lowerH === 'na' || 
    lowerH === 'n/a' || 
    lowerH === 'none' || 
    lowerH === '.' || 
    lowerH === '-' || 
    lowerH === '' ||
    lowerH.includes('not applicable') ||
    lowerH.includes('available soon')
  ) {
    return null;
  }

  // Strip URLs
  // Handle examples: 
  // https://leetcode.com/u/user/ -> user
  // https://www.geeksforgeeks.org/profile/user -> user
  // https://github.com/user -> user
  try {
    if (h.includes('http')) {
      const parts = h.split('/');
      // Filter out empty parts and return the last non-empty one
      const filtered = parts.filter(p => p.length > 0);
      const last = filtered[filtered.length - 1];
      
      // If it's a profile URL, the last part is usually the handle
      // but avoid common path names
      if (last.toLowerCase() === 'u' || last.toLowerCase() === 'profile') {
        return filtered[filtered.length - 1]; // Fallback, though usually handle follows u/
      }
      return last;
    }
  } catch (e) {
    return h;
  }

  // Strip leading '@' if present
  if (h.startsWith('@')) return h.substring(1);

  return h;
}

function parseYear(yearStr: string): number {
  if (!yearStr) return 0;
  const match = yearStr.match(/\d+/);
  return match ? parseInt(match[0]) : 0;
}

async function main() {
  const tsvPath = path.join(__dirname, '../data/platform.tsv');
  
  if (!fs.existsSync(tsvPath)) {
    console.error('Error: platform.tsv not found in src/data/');
    return;
  }

  console.log('--- Database Reset ---');
  // Order of deletion matters due to foreign keys
  await prisma.fetchJob.deleteMany();
  await prisma.codingStats.deleteMany();
  await prisma.student.deleteMany();
  console.log('Cleared existing data.');

  const content = fs.readFileSync(tsvPath, 'utf-8');
  const lines = content.split('\n');
  const header = lines[0].split('\t');
  
  console.log(`Analyzing ${lines.length - 1} records...`);

  const hashedPassword = await bcrypt.hash('password123', 10);
  let successCount = 0;
  let errorCount = 0;

  // Indices based on analyse:
  // 1: Roll No, 2: Name, 3: Library ID, 4: Year, 6: Branch, 7: Section, 8: Email
  // 11: LeetCode, 12: CodeChef, 13: CodeForces, 14: GfG, 15: GitHub

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split('\t');
    if (cols.length < 15) continue;

    try {
      const rawLibraryId = cols[3];
      const libraryId = normalizeLibraryId(rawLibraryId);
      
      if (!libraryId) {
        // Fallback to roll no if libraryId is missing, but usually libraryId is required
        console.warn(`Row ${i}: Missing library ID, skipping.`);
        continue;
      }

      const name = cols[2]?.trim() || 'Unknown';
      const rollNo = cols[1]?.trim() === '48' ? null : cols[1]?.trim() || null; // Fix specifically messy rollNo
      const year = parseYear(cols[4]);
      const branch = cols[6]?.trim() || 'Unknown';
      const section = cols[7]?.trim() || null;
      const email = cols[8]?.trim() || null;

      const leetcodeHandle = cleanHandle(cols[11]);
      const codechefHandle = cleanHandle(cols[12]);
      const codeforcesHandle = cleanHandle(cols[13]);
      const gfgHandle = cleanHandle(cols[14]);
      const githubHandle = cleanHandle(cols[15]);

      await prisma.student.upsert({
        where: { libraryId },
        update: {
          name,
          rollNo,
          email,
          branch,
          graduationYear: year ? 2026 + (4 - year) : 2027, courseDuration: 4,
          section,
          leetcodeHandle,
          codeforcesHandle,
          codechefHandle,
          gfgHandle,
          githubHandle,
        },
        create: {
          name,
          libraryId,
          rollNo,
          email,
          branch,
          graduationYear: year ? 2026 + (4 - year) : 2027, courseDuration: 4,
          section,
          password: hashedPassword,
          leetcodeHandle,
          codeforcesHandle,
          codechefHandle,
          gfgHandle,
          githubHandle,
          codingStats: {
            create: {}
          }
        }
      });

      successCount++;
      if (successCount % 100 === 0) console.log(`Seeded ${successCount} students...`);
    } catch (error: any) {
      console.error(`Error seeding row ${i} (${cols[2]}):`, error.message);
      errorCount++;
    }
  }

  console.log('\n--- Seeding Completed ---');
  console.log(`Successfully seeded: ${successCount}`);
  console.log(`Errors encountered: ${errorCount}`);
  
  await prisma.$disconnect();
}

main().catch(console.error);
