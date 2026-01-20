import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
    customerName: {
        type: String,
        required: true
    },
    customerEmail: {
        type: String,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    customerPhone: {
        type: String
    },
    source: {
        type: String,
        enum: ['PORTAL', 'WHATSAPP', 'CALL', 'OTHER'],
        default: 'PORTAL'
    },
    stage: {
        type: String,
        enum: ['NEW', 'CONTACTED', 'SITE_VISIT_SCHEDULED', 'OFFER', 'CLOSED', 'LOST'],
        default: 'NEW'
    },
    budgetMin: {
        type: Number
    },
    budgetMax: {
        type: Number
    },
    city: {
        type: String
    },
    notes: {
        type: String
    },
    assignedAgent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
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

const Lead = mongoose.model('Lead', leadSchema);

export default Lead;
