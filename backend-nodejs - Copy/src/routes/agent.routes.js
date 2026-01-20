import express from 'express';
import AgentController from '../controllers/agentController.js';

const router = express.Router();

router.post('/:agentId/message', AgentController.messageAgent);

export default router;
