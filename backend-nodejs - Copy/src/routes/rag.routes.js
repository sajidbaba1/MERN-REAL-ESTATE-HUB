import express from 'express';
import RagController from '../controllers/ragController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('ADMIN'));

router.post('/ingest', RagController.ingest);
router.post('/query', RagController.query);

export default router;
