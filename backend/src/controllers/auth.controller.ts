import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/db';
import { logger } from '../utils/logger';
import { sanitizeHandle } from '../utils/sanitizer';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, rollNo, email, password, branch, year, leetcodeHandle, githubHandle, gfgHandle, codeforcesHandle, codechefHandle } = req.body;

    const existingStudent = await prisma.student.findUnique({
      where: { rollNo },
    });

    if (existingStudent) {
      return res.status(400).json({ status: 'error', message: 'Student with this Roll Number already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const student = await prisma.student.create({
      data: {
        name,
        rollNo,
        email,
        password: hashedPassword,
        branch,
        year: parseInt(year) || 1,
        leetcodeHandle: sanitizeHandle(leetcodeHandle, 'leetcode'),
        githubHandle: sanitizeHandle(githubHandle, 'github'),
        gfgHandle: sanitizeHandle(gfgHandle, 'gfg'),
        codeforcesHandle: sanitizeHandle(codeforcesHandle, 'codeforces'),
        codechefHandle: sanitizeHandle(codechefHandle, 'codechef'),
      },
    });

    res.status(201).json({ status: 'success', message: 'Student registered successfully', data: { id: student.id, name: student.name, rollNo: student.rollNo } });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rollNo, password } = req.body;

    const student = await prisma.student.findUnique({
      where: { rollNo },
    });

    if (!student || !(await bcrypt.compare(password, student.password))) {
      return res.status(401).json({ status: 'error', message: 'Invalid Roll Number or password' });
    }

    const token = jwt.sign({ id: student.id, rollNo: student.rollNo }, JWT_SECRET, { expiresIn: '24h' });

    res.json({ status: 'success', token, data: { id: student.id, name: student.name, rollNo: student.rollNo } });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rollNo } = req.body;

    const student = await prisma.student.findUnique({
      where: { rollNo },
    });

    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Student not found' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await prisma.student.update({
      where: { id: student.id },
      data: { resetToken, resetTokenExpiry },
    });

    // In a real app, you'd send an email here. For now, we'll just return the token.
    logger.info(`Password reset requested for ${rollNo}. Token: ${resetToken}`);
    
    res.json({ 
      status: 'success', 
      message: 'Password reset token generated (Check server logs in production)',
      resetToken // Returning it for demo/testing convenience
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resetToken, newPassword } = req.body;

    const student = await prisma.student.findUnique({
      where: { resetToken },
    });

    if (!student || !student.resetTokenExpiry || student.resetTokenExpiry < new Date()) {
      return res.status(400).json({ status: 'error', message: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.student.update({
      where: { id: student.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    res.json({ status: 'success', message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};
