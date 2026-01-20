import express from 'express';
import InquiryController from '../controllers/inquiryController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/admin/all', authorize('ADMIN'), InquiryController.getAllAdminInquiries);
router.post('/', InquiryController.createInquiry);
router.get('/my', InquiryController.getMyInquiries);
router.get('/owner', InquiryController.getOwnerInquiries);
router.get('/unread-count', InquiryController.getUnreadCount);
router.get('/:inquiryId', InquiryController.getInquiry);
router.post('/:inquiryId/messages', InquiryController.sendMessage);
router.patch('/:inquiryId/status', InquiryController.updateStatus);

// New features: Document and Payment flow
router.post('/:inquiryId/submit-document', InquiryController.submitDocument);
router.post('/:inquiryId/verify-document', InquiryController.verifyDocument);
router.post('/:inquiryId/approve-payment', InquiryController.approveForPayment);
router.post('/:inquiryId/process-payment', InquiryController.processPayment);

export default router;
