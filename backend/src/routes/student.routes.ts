import { Router } from 'express';
import { getStudents, createStudent, triggerFetch, updateStudent, getStudentById, syncAll, updateProfile, getOnlineStudents } from '../controllers/students.controller';
import { apiRateLimiter } from '../middleware/rateLimiter';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(apiRateLimiter);

router.get('/', getStudents);
router.get('/online', getOnlineStudents); // ← Must be before /:id routes
router.post('/sync-all', syncAll);       // ← Must be before /:id routes
router.put('/profile', authenticate, updateProfile); // Pinned current user edit
router.get('/:id', getStudentById);
router.post('/', createStudent);
router.patch('/:id', authenticate, updateStudent);
router.post('/:id/fetch', authenticate, triggerFetch);

export default router;
