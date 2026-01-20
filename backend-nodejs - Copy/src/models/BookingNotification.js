import mongoose from 'mongoose';

const bookingNotificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rentBooking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RentBooking'
    },
    pgBooking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PgBooking'
    },
    type: {
        type: String,
        enum: [
            'BOOKING_CREATED',
            'BOOKING_APPROVED',
            'BOOKING_REJECTED',
            'BOOKING_CANCELLED',
            'BOOKING_EXTENDED',
            'BOOKING_TERMINATED',
            'PAYMENT_DUE',
            'PAYMENT_OVERDUE',
            'PAYMENT_RECEIVED',
            'LATE_FEE_APPLIED',
            'REVIEW_REQUEST',
            'REVIEW_RECEIVED',
            'MAINTENANCE_REQUEST',
            'CONTRACT_RENEWAL',
            'SYSTEM_ANNOUNCEMENT'
        ],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String
    },
    isRead: {
        type: Boolean,
        default: false
    },
    priority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
        default: 'MEDIUM'
    },
    actionUrl: {
        type: String
    },
    expiresAt: {
        type: Date
    }
}, {
    timestamps: { createdAt: true, updatedAt: false },
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

const BookingNotification = mongoose.model('BookingNotification', bookingNotificationSchema);

export default BookingNotification;
