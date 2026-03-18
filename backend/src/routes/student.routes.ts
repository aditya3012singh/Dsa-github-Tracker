import { Router } from 'express';
import { getStudents, createStudent, triggerFetch, updateStudent, getStudentById, syncAll } from '../controllers/students.controller';
import { apiRateLimiter } from '../middleware/rateLimiter';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(apiRateLimiter);

router.get('/', getStudents);
router.post('/sync-all', syncAll);       // ← Must be before /:id routes
router.get('/:id', getStudentById);
router.post('/', createStudent);
router.patch('/:id', authenticate, updateStudent);
router.post('/:id/fetch', authenticate, triggerFetch);

export default router;
