import mongoose from 'mongoose';

const otpTokenSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    otpCode: {
        type: String,
        required: true,
        length: 6
    },
    expiresAt: {
        type: Date,
        required: true
    },
    used: {
        type: Boolean,
        default: false
    },
    attempts: {
        type: Number,
        default: 0
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

// Helper for validity
otpTokenSchema.methods.isValid = function () {
    return !this.used && this.expiresAt > new Date() && this.attempts < 3;
};

const OtpToken = mongoose.model('OtpToken', otpTokenSchema);

export default OtpToken;
