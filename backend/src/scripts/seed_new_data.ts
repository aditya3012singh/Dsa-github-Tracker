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

const BRANCH_MAPPING: Record<string, string> = {
  "Electrical & Computer Engineering": "ECE",
  "Electronics and communication Engineering (VLSI Design and Technology)": "VLSI",
  "Advanced Mechatronics and Industrial Automation": "Adv. Mechatronic",
  "ece vlsi": "VLSI"
};

function normalizeBranch(branch: string): string {
  if (!branch) return 'Unknown';
  const trimmed = branch.trim();
  return BRANCH_MAPPING[trimmed] || trimmed;
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
  try {
    if (h.includes('http')) {
      const parts = h.split('/');
      // Filter out empty parts and return the last non-empty one
      const filtered = parts.filter(p => p.length > 0);
      if (filtered.length === 0) return null;
      const last = filtered[filtered.length - 1];
      
      // If it's a profile URL, the last part is usually the handle
      // but avoid common path names
      if (last.toLowerCase() === 'u' || last.toLowerCase() === 'profile') {
        return filtered[filtered.length - 1]; // Fallback
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
  const platformTsvPath = path.join(__dirname, '../data/platform.tsv');
  const newDataTsvPath = path.join(__dirname, '../data/newdata.tsv');

  if (!fs.existsSync(platformTsvPath)) {
    console.error('Error: platform.tsv not found in src/data/');
    return;
  }
  if (!fs.existsSync(newDataTsvPath)) {
    console.error('Error: newdata.tsv not found in src/data/');
    return;
  }

  // 1. Get already seeded Library IDs from platform.tsv
  console.log('Reading existing platform.tsv to identify already seeded students...');
  const platformContent = fs.readFileSync(platformTsvPath, 'utf-8');
  const platformLines = platformContent.split('\n');
  const seededLibraryIds = new Set<string>();

  for (let i = 1; i < platformLines.length; i++) {
    const line = platformLines[i].trim();
    if (!line) continue;
    const cols = line.split('\t');
    if (cols.length > 3) {
      const libId = normalizeLibraryId(cols[3]);
      if (libId) seededLibraryIds.add(libId);
    }
  }
  console.log(`Found ${seededLibraryIds.size} students in platform.tsv.`);

  // 2. Read newdata.tsv and process
  console.log('Reading newdata.tsv and seeding only new students...');
  const newContent = fs.readFileSync(newDataTsvPath, 'utf-8');
  const newLines = newContent.split('\n');
  
  const hashedPassword = await bcrypt.hash('password123', 10);
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (let i = 1; i < newLines.length; i++) {
    const line = newLines[i].trim();
    if (!line) continue;

    const cols = line.split('\t');
    if (cols.length < 15) continue;

    const rawLibraryId = cols[3];
    const libraryId = normalizeLibraryId(rawLibraryId);

    if (!libraryId) {
      console.warn(`Row ${i}: Missing library ID, skipping.`);
      continue;
    }

    if (seededLibraryIds.has(libraryId)) {
      skipCount++;
      continue;
    }

    try {
      const name = cols[2]?.trim() || 'Unknown';
      const rollNo = cols[1]?.trim() === '48' ? null : cols[1]?.trim() || null;
      const year = parseYear(cols[4]);
      const branch = normalizeBranch(cols[6]);
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
          year,
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
          year,
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
      // Mark as seeded to avoid duplicates within newdata.tsv itself
      seededLibraryIds.add(libraryId);
      
      if (successCount % 50 === 0) console.log(`Seeded ${successCount} new students...`);
    } catch (error: any) {
      console.error(`Error seeding row ${i} (${cols[2]}):`, error.message);
      errorCount++;
    }
  }

  console.log('\n--- Seeding Completed ---');
  console.log(`Newly seeded: ${successCount}`);
  console.log(`Skipped (already in platform.tsv): ${skipCount}`);
  console.log(`Errors encountered: ${errorCount}`);
  
  await prisma.$disconnect();
}

main().catch(console.error);
