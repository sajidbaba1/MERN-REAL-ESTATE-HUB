import express from 'express';
import LeadController from '../controllers/leadController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('ADMIN', 'AGENT'));

router.post('/', LeadController.create);
router.get('/', LeadController.list);
router.get('/:id', LeadController.getOne);
router.patch('/:id', LeadController.update);

export default router;
