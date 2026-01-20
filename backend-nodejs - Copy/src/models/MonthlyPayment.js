import mongoose from 'mongoose';

const monthlyPaymentSchema = new mongoose.Schema({
    rentBooking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RentBooking'
    },
    pgBooking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PgBooking'
    },
    dueDate: {
        type: Date,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'],
        default: 'PENDING'
    },
    paidDate: {
        type: Date
    },
    paymentReference: {
        type: String
    },
    lateFee: {
        type: Number
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

const MonthlyPayment = mongoose.model('MonthlyPayment', monthlyPaymentSchema);

export default MonthlyPayment;
