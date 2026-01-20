import BookingReview from '../models/BookingReview.js';
import RentBooking from '../models/RentBooking.js';
import PgBooking from '../models/PgBooking.js';
import User from '../models/User.js';
import bookingNotificationService from '../services/bookingNotificationService.js';

class BookingReviewController {
    // Create review
    async createReview(req, res) {
        try {
            const {
                rentBookingId,
                pgBookingId,
                revieweeId,
                reviewType,
                rating,
                comment,
                cleanlinessRating,
                communicationRating,
                reliabilityRating,
                propertyConditionRating,
                neighborhoodRating,
                isAnonymous
            } = req.body;

            // Validation
            if (!rating || rating < 1 || rating > 5) {
                return res.status(400).json({ message: 'Rating must be between 1 and 5' });
            }

            if (!revieweeId) {
                return res.status(400).json({ message: 'Reviewee ID is required' });
            }

            if ((!rentBookingId && !pgBookingId) || (rentBookingId && pgBookingId)) {
                return res.status(400).json({ message: 'Either rent booking ID or PG booking ID must be provided, not both' });
            }

            const reviewee = await User.findById(revieweeId);
            if (!reviewee) return res.status(400).json({ message: 'Reviewee not found' });

            let rentBooking = null;
            let pgBooking = null;

            // Validate rent booking
            if (rentBookingId) {
                rentBooking = await RentBooking.findById(rentBookingId).populate('tenant owner');
                if (!rentBooking) return res.status(400).json({ message: 'Rent booking not found' });

                if (!this.canReviewBooking(req.user.id, rentBooking.tenant._id.toString(), rentBooking.owner._id.toString())) {
                    return res.status(403).json({ message: 'Not authorized to review this booking' });
                }

                if (rentBooking.status === 'PENDING_APPROVAL' || rentBooking.status === 'REJECTED') {
                    return res.status(400).json({ message: "Cannot review booking that hasn't been active" });
                }

                const existingReview = await BookingReview.findOne({
                    rentBooking: rentBookingId,
                    reviewer: req.user.id
                });
                if (existingReview) {
                    return res.status(400).json({ message: 'Review already exists for this booking' });
                }
            }

            // Validate PG booking
            if (pgBookingId) {
                pgBooking = await PgBooking.findById(pgBookingId).populate('tenant owner');
                if (!pgBooking) return res.status(400).json({ message: 'PG booking not found' });

                if (!this.canReviewBooking(req.user.id, pgBooking.tenant._id.toString(), pgBooking.owner._id.toString())) {
                    return res.status(403).json({ message: 'Not authorized to review this booking' });
                }

                if (pgBooking.status === 'PENDING_APPROVAL' || pgBooking.status === 'REJECTED') {
                    return res.status(400).json({ message: "Cannot review booking that hasn't been active" });
                }

                const existingReview = await BookingReview.findOne({
                    pgBooking: pgBookingId,
                    reviewer: req.user.id
                });
                if (existingReview) {
                    return res.status(400).json({ message: 'Review already exists for this booking' });
                }
            }

            // Create review
            const review = new BookingReview({
                rentBooking: rentBookingId,
                pgBooking: pgBookingId,
                reviewer: req.user.id,
                reviewee: revieweeId,
                reviewType,
                rating,
                comment,
                cleanlinessRating,
                communicationRating,
                reliabilityRating,
                propertyConditionRating,
                neighborhoodRating,
                isAnonymous: isAnonymous || false,
                isVerified: false
            });

            const saved = await review.save();

            // Send notification
            const title = 'New Review Received';
            const message = `You have received a new ${rating}-star review${isAnonymous ? '' : ' from ' + req.user.firstName}`;
            await bookingNotificationService.createNotification(
                reviewee,
                'REVIEW_RECEIVED',
                title,
                message,
                '/reviews',
                rentBooking,
                pgBooking
            );

            res.status(201).json(saved);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Get reviews for user
    async getUserReviews(req, res) {
        try {
            const { userId } = req.params;
            const page = parseInt(req.query.page) || 0;
            const size = parseInt(req.query.size) || 10;

            const reviews = await BookingReview.find({ reviewee: userId })
                .sort({ createdAt: -1 })
                .skip(page * size)
                .limit(size)
                .populate('reviewer', 'firstName lastName')
                .populate('reviewee', 'firstName lastName');

            const totalReviews = await BookingReview.countDocuments({ reviewee: userId });

            // Calculate averages
            const avgResult = await BookingReview.aggregate([
                { $match: { reviewee: userId } },
                {
                    $group: {
                        _id: null,
                        averageRating: { $avg: '$rating' },
                        avgCleanliness: { $avg: '$cleanlinessRating' },
                        avgCommunication: { $avg: '$communicationRating' },
                        avgReliability: { $avg: '$reliabilityRating' }
                    }
                }
            ]);

            const averages = avgResult[0] || {};

            // Rating breakdown
            const ratingBreakdown = {};
            for (let i = 1; i <= 5; i++) {
                ratingBreakdown[i] = await BookingReview.countDocuments({ reviewee: userId, rating: i });
            }

            res.json({
                reviews,
                totalReviews,
                totalPages: Math.ceil(totalReviews / size),
                averageRating: averages.averageRating ? Math.round(averages.averageRating * 10) / 10 : 0,
                averageCleanliness: averages.avgCleanliness ? Math.round(averages.avgCleanliness * 10) / 10 : 0,
                averageCommunication: averages.avgCommunication ? Math.round(averages.avgCommunication * 10) / 10 : 0,
                averageReliability: averages.avgReliability ? Math.round(averages.avgReliability * 10) / 10 : 0,
                ratingBreakdown
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Get my reviews (as reviewer)
    async getMyReviews(req, res) {
        try {
            const page = parseInt(req.query.page) || 0;
            const size = parseInt(req.query.size) || 10;

            const reviews = await BookingReview.find({ reviewer: req.user.id })
                .sort({ createdAt: -1 })
                .skip(page * size)
                .limit(size)
                .populate('reviewee', 'firstName lastName');

            const totalReviews = await BookingReview.countDocuments({ reviewer: req.user.id });

            res.json({
                reviews,
                totalReviews,
                totalPages: Math.ceil(totalReviews / size)
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Get reviews for specific booking
    async getRentBookingReviews(req, res) {
        try {
            const reviews = await BookingReview.find({ rentBooking: req.params.bookingId })
                .sort({ createdAt: -1 })
                .populate('reviewer', 'firstName lastName')
                .populate('reviewee', 'firstName lastName');
            res.json(reviews);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getPgBookingReviews(req, res) {
        try {
            const reviews = await BookingReview.find({ pgBooking: req.params.bookingId })
                .sort({ createdAt: -1 })
                .populate('reviewer', 'firstName lastName')
                .populate('reviewee', 'firstName lastName');
            res.json(reviews);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Update review
    async updateReview(req, res) {
        try {
            const review = await BookingReview.findById(req.params.reviewId);
            if (!review) return res.status(404).json({ message: 'Review not found' });

            if (review.reviewer.toString() !== req.user.id && req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Not authorized to update this review' });
            }

            const { rating, comment, cleanlinessRating, communicationRating, reliabilityRating, propertyConditionRating, neighborhoodRating } = req.body;

            if (rating && rating >= 1 && rating <= 5) review.rating = rating;
            if (comment !== undefined) review.comment = comment;
            if (cleanlinessRating) review.cleanlinessRating = cleanlinessRating;
            if (communicationRating) review.communicationRating = communicationRating;
            if (reliabilityRating) review.reliabilityRating = reliabilityRating;
            if (propertyConditionRating) review.propertyConditionRating = propertyConditionRating;
            if (neighborhoodRating) review.neighborhoodRating = neighborhoodRating;

            const saved = await review.save();
            res.json(saved);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Delete review
    async deleteReview(req, res) {
        try {
            const review = await BookingReview.findById(req.params.reviewId);
            if (!review) return res.status(404).json({ message: 'Review not found' });

            if (review.reviewer.toString() !== req.user.id && req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Not authorized to delete this review' });
            }

            await BookingReview.findByIdAndDelete(req.params.reviewId);
            res.json({ message: 'Review deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Mark review as helpful
    async markReviewHelpful(req, res) {
        try {
            const review = await BookingReview.findById(req.params.reviewId);
            if (!review) return res.status(404).json({ message: 'Review not found' });

            review.helpfulCount = (review.helpfulCount || 0) + 1;
            await review.save();

            res.json({ message: 'Review marked as helpful' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Get featured reviews
    async getFeaturedReviews(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const reviews = await BookingReview.find({ rating: { $gte: 4 } })
                .sort({ rating: -1, createdAt: -1 })
                .limit(limit)
                .populate('reviewer', 'firstName lastName')
                .populate('reviewee', 'firstName lastName');

            res.json(reviews);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Helper method
    canReviewBooking(reviewerId, tenantId, ownerId) {
        return reviewerId === tenantId || reviewerId === ownerId;
    }
}

export default new BookingReviewController();
