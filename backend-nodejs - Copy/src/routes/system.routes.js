import express from 'express';
import SystemController from '../controllers/systemController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/test-email', SystemController.sendTestEmail);

export default router;
