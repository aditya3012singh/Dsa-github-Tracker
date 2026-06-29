import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/db';
import { userSyncQueue } from '../queues/stats.queue';
import { sanitizeHandle } from '../utils/sanitizer';
import { logger } from '../utils/logger';

interface StudentInput {
  name: string;
  libraryId: string;
  rollNo?: string;
  email?: string;
  branch: string;
  year: number | string;
  section?: string;
  leetcodeHandle?: string;
  codeforcesHandle?: string;
  gfgHandle?: string;
  codechefHandle?: string;
  githubHandle?: string;
  linkedIn?: string;
  password?: string;
}

export const bulkRegisterStudents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawStudents = Array.isArray(req.body) ? req.body : [req.body];
    
    const results: Array<{
      libraryId: string;
      name?: string;
      status: 'success' | 'failed';
      id?: string;
      error?: string;
    }> = [];

    let successCount = 0;
    let failedCount = 0;

    for (const raw of rawStudents) {
      const studentInput = raw as StudentInput;
      const { name, libraryId, rollNo, email, branch, year: rawYear, section, leetcodeHandle, codeforcesHandle, gfgHandle, codechefHandle, githubHandle, linkedIn, password } = studentInput;

      // 1. Validation
      if (!name || typeof name !== 'string' || !name.trim()) {
        results.push({ libraryId: libraryId || 'UNKNOWN', status: 'failed', error: 'Name is required and must be a string' });
        failedCount++;
        continue;
      }

      if (!libraryId || typeof libraryId !== 'string' || !libraryId.trim()) {
        results.push({ libraryId: 'UNKNOWN', name, status: 'failed', error: 'Library ID is required and must be a string' });
        failedCount++;
        continue;
      }

      if (!branch || typeof branch !== 'string' || !branch.trim()) {
        results.push({ libraryId, name, status: 'failed', error: 'Branch is required and must be a string' });
        failedCount++;
        continue;
      }

      const year = parseInt(rawYear as string, 10);
      if (isNaN(year)) {
        results.push({ libraryId, name, status: 'failed', error: 'Year is required and must be a valid integer' });
        failedCount++;
        continue;
      }

      try {
        // 2. Check for duplicate libraryId
        const existingLibraryId = await prisma.student.findUnique({
          where: { libraryId: libraryId.trim() }
        });

        if (existingLibraryId) {
          results.push({ libraryId, name, status: 'failed', error: 'Student with this Library ID already exists' });
          failedCount++;
          continue;
        }

        // 3. Check for duplicate email if provided
        if (email && email.trim()) {
          const existingEmail = await prisma.student.findUnique({
            where: { email: email.trim() }
          });
          if (existingEmail) {
            results.push({ libraryId, name, status: 'failed', error: 'Student with this Email already exists' });
            failedCount++;
            continue;
          }
        }

        // 4. Hash password (defaults to 'password123')
        const rawPassword = password || 'password123';
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        // 5. Sanitize handles
        const cleanLeetcode = sanitizeHandle(leetcodeHandle || '', 'leetcode') || null;
        const cleanCodeforces = sanitizeHandle(codeforcesHandle || '', 'codeforces') || null;
        const cleanGfg = sanitizeHandle(gfgHandle || '', 'gfg') || null;
        const cleanCodechef = sanitizeHandle(codechefHandle || '', 'codechef') || null;
        const cleanGithub = sanitizeHandle(githubHandle || '', 'github') || null;

        // 6. Create Student and CodingStats in the database
        const student = await prisma.student.create({
          data: {
            name: name.trim(),
            libraryId: libraryId.trim(),
            rollNo: rollNo ? rollNo.trim() : null,
            email: email ? email.trim() : null,
            branch: branch.trim(),
            year,
            section: section ? section.trim() : null,
            leetcodeHandle: cleanLeetcode,
            codeforcesHandle: cleanCodeforces,
            gfgHandle: cleanGfg,
            codechefHandle: cleanCodechef,
            githubHandle: cleanGithub,
            linkedIn: linkedIn ? linkedIn.trim() : null,
            password: hashedPassword,
            codingStats: {
              create: {} // Automatically creates coding stats entry
            }
          }
        });

        // 7. Enqueue initial fetches in userSyncQueue
        const platforms = [
          { name: 'leetcode', handle: cleanLeetcode },
          { name: 'codeforces', handle: cleanCodeforces },
          { name: 'codechef', handle: cleanCodechef },
          { name: 'gfg', handle: cleanGfg },
          { name: 'github', handle: cleanGithub }
        ] as const;

        for (const p of platforms) {
          if (p.handle) {
            await userSyncQueue.add(p.name as any, {
              studentId: student.id,
              platform: p.name as any,
              handle: p.handle,
            });
          }
        }

        results.push({ libraryId, name, status: 'success', id: student.id });
        successCount++;
      } catch (err: any) {
        logger.error(`Failed to register student ${name} (LibId: ${libraryId}):`, err);
        results.push({ libraryId, name, status: 'failed', error: err.message || 'Database insert failed' });
        failedCount++;
      }
    }

    res.json({
      status: 'success',
      summary: {
        total: rawStudents.length,
        success: successCount,
        failed: failedCount
      },
      results
    });
  } catch (error) {
    next(error);
  }
};
