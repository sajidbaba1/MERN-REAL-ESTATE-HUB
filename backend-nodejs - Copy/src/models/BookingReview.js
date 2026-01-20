import mongoose from 'mongoose';

const bookingReviewSchema = new mongoose.Schema({
    rentBooking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RentBooking'
    },
    pgBooking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PgBooking'
    },
    reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reviewee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reviewType: {
        type: String,
        enum: ['TENANT_TO_OWNER', 'OWNER_TO_TENANT', 'PROPERTY_REVIEW'],
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String
    },
    cleanlinessRating: {
        type: Number
    },
    communicationRating: {
        type: Number
    },
    reliabilityRating: {
        type: Number
    },
    propertyConditionRating: {
        type: Number
    },
    neighborhoodRating: {
        type: Number
    },
    isAnonymous: {
        type: Boolean,
        default: false
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    helpfulCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

const BookingReview = mongoose.model('BookingReview', bookingReviewSchema);

export default BookingReview;
