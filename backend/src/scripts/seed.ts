import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const dataPath = path.join(__dirname, '../data/students.json');
  
  if (!fs.existsSync(dataPath)) {
    console.error('Error: students.json not found in src/data/');
    console.log('Please create the file with the following format:');
    console.log(JSON.stringify([
      {
        "name": "John Doe",
        "rollNo": "20CS01",
        "branch": "CS",
        "year": 3,
        "leetcodeHandle": "john_lc",
        "codeforcesHandle": "john_cf",
        "gfgHandle": "john_gfg",
        "codechefHandle": "john_cc",
        "githubHandle": "john_gh"
      }
    ], null, 2));
    return;
  }

  const students = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  console.log(`Found ${students.length} students to seed.`);

  const hashedPassword = await bcrypt.hash('password123', 10);

  let successCount = 0;
  let skipCount = 0;

  for (const student of students) {
    try {
      const libraryId = student.libraryId || `LIB-${student.rollNo}`; // Fallback if missing
      await prisma.student.upsert({
        where: { libraryId },
        update: {},
        create: {
          name: student.name,
          libraryId,
          rollNo: student.rollNo,
          branch: student.branch,
          year: student.year,
          leetcodeHandle: student.leetcodeHandle || null,
          codeforcesHandle: student.codeforcesHandle || null,
          gfgHandle: student.gfgHandle || null,
          codechefHandle: student.codechefHandle || null,
          githubHandle: student.githubHandle || null,
          password: hashedPassword,
        },
      });
      successCount++;
      if (successCount % 50 === 0) console.log(`Processed ${successCount} students...`);
    } catch (error) {
      console.error(`Failed to seed student:`, error);
      skipCount++;
    }
  }

  console.log('--- Seeding Completed ---');
  console.log(`Successfully seeded/updated: ${successCount}`);
  console.log(`Skipped/Errors: ${skipCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
