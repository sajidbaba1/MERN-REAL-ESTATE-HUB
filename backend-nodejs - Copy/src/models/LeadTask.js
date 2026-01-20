import mongoose from 'mongoose';

const leadTaskSchema = new mongoose.Schema({
    lead: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    dueAt: {
        type: Date
    },
    status: {
        type: String,
        enum: ['PENDING', 'DONE'],
        default: 'PENDING'
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

const LeadTask = mongoose.model('LeadTask', leadTaskSchema);

export default LeadTask;
