import mongoose from 'mongoose';

const pgBookingSchema = new mongoose.Schema({
    bed: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PgBed',
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
        enum: ['PENDING_APPROVAL', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'REJECTED', 'TERMINATED'],
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
    lateFeeRate: {
        type: Number
    },
    gracePeriodDays: {
        type: Number
    },
    terminationReason: {
        type: String
    },
    terminationDate: {
        type: Date
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

const PgBooking = mongoose.model('PgBooking', pgBookingSchema);

export default PgBooking;
