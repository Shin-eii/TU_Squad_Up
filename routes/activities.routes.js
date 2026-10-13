import { Router } from 'express';
import { createActivity } from '../controllers/activities.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.post('/', requireAuth, createActivity);

export default router;
