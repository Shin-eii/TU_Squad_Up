import { Router } from 'express';
import { getCurrentMember, logout, mockLogin } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.post('/mock-login', mockLogin);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, getCurrentMember);

export default router;
