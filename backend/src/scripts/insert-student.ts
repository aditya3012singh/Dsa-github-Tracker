import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

const prisma = new PrismaClient();

function getArgValue(argName: string): string | null {
  const arg = process.argv.find(a => a.startsWith(`--${argName}=`));
  return arg ? arg.split('=')[1] : null;
}

async function main() {
  console.log('--- Database Record Inserter ---');

  // Read arguments or use defaults
  const name = getArgValue('name') || 'Test Student';
  const libraryId = getArgValue('libraryId') || `LIB-${Math.floor(100000 + Math.random() * 900000)}`;
  const rollNo = getArgValue('rollNo') || null;
  const email = getArgValue('email') || null;
  const branch = getArgValue('branch') || 'CS';
  const graduationYearStr = getArgValue('graduationYear') || '2027';
  const graduationYear = parseInt(graduationYearStr, 10);
  const section = getArgValue('section') || null;
  const leetcodeHandle = getArgValue('leetcodeHandle') || null;
  const linkedIn = getArgValue('linkedIn') || null;
  const rawPassword = getArgValue('password') || 'password123';

  if (isNaN(graduationYear)) {
    console.error('Error: graduationYear must be a number.');
    process.exit(1);
  }

  console.log('Connecting to database and hashing password...');
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  console.log(`Creating student record:`);
  console.log(`- Name: ${name}`);
  console.log(`- Library ID: ${libraryId}`);
  console.log(`- Roll No: ${rollNo}`);
  console.log(`- Email: ${email}`);
  console.log(`- Branch: ${branch}`);
  console.log(`- Graduation Year: ${graduationYear}`);
  console.log(`- Section: ${section}`);
  console.log(`- Leetcode: ${leetcodeHandle}`);
  console.log(`- LinkedIn: ${linkedIn}`);
  console.log(`- Password: [MASKED] (raw: "${rawPassword}")`);

  const student = await prisma.student.create({
    data: {
      name,
      libraryId,
      rollNo,
      email,
      branch,
      graduationYear,
      courseDuration: branch.toUpperCase() === 'MCA' ? 2 : 4,
      section,
      leetcodeHandle,
      linkedIn,
      password: hashedPassword,
      codingStats: {
        create: {} // Automatically creates coding stats entry
      }
    },
    include: {
      codingStats: true
    }
  });

  console.log('\nSuccessfully created student and codingStats records!');
  console.log('Inserted Student ID:', student.id);
  console.log('Inserted Student Data:', JSON.stringify(student, null, 2));
}

main()
  .catch((e) => {
    console.error('\nError creating student record:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('Database connection closed.');
  });
