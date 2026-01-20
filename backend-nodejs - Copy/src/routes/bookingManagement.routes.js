import express from 'express';
import BookingManagementController from '../controllers/bookingManagementController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/rent/:bookingId/approve', authorize('ADMIN', 'AGENT'), BookingManagementController.approveRentBooking);
router.post('/pg/:bookingId/approve', authorize('ADMIN', 'AGENT'), BookingManagementController.approvePgBooking);
router.post('/rent/:bookingId/reject', authorize('ADMIN', 'AGENT'), BookingManagementController.rejectRentBooking);
router.post('/:bookingId/cancel', BookingManagementController.cancelBooking);
router.get('/pending-approvals', authorize('ADMIN', 'AGENT'), BookingManagementController.getPendingApprovals);

export default router;
