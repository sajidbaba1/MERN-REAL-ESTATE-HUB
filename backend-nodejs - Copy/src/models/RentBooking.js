import mongoose from 'mongoose';

const rentBookingSchema = new mongoose.Schema({
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: true
    },
    tenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date
    },
    monthlyRent: {
        type: Number,
        required: true
    },
    securityDeposit: {
        type: Number
    },
    status: {
        type: String,
        enum: ['PENDING_APPROVAL', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'REJECTED', 'EXTENDED', 'TERMINATED'],
        default: 'PENDING_APPROVAL'
    },
    approvalDate: {
        type: Date
    },
    rejectionReason: {
        type: String
    },
    cancellationReason: {
        type: String
    },
    terminationReason: {
        type: String
    },
    terminationDate: {
        type: Date
    },
    lateFeeRate: {
        type: Number,
        default: 5.0
    },
    gracePeriodDays: {
        type: Number,
        default: 3
    },
    autoRenewal: {
        type: Boolean,
        default: false
    },
    isPaid: {
        type: Boolean,
        default: false
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

const RentBooking = mongoose.model('RentBooking', rentBookingSchema);

export default RentBooking;
