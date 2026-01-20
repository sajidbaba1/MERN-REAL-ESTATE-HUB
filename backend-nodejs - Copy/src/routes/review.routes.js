import express from 'express';
import BookingReviewController from '../controllers/bookingReviewController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', BookingReviewController.createReview);
router.get('/user/:userId', BookingReviewController.getUserReviews);
router.get('/my-reviews', BookingReviewController.getMyReviews);
router.get('/booking/rent/:bookingId', BookingReviewController.getRentBookingReviews);
router.get('/booking/pg/:bookingId', BookingReviewController.getPgBookingReviews);
router.put('/:reviewId', BookingReviewController.updateReview);
router.delete('/:reviewId', BookingReviewController.deleteReview);
router.post('/:reviewId/helpful', BookingReviewController.markReviewHelpful);
router.get('/featured', BookingReviewController.getFeaturedReviews);

export default router;
