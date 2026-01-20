import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['INQUIRY_NEW', 'INQUIRY_UPDATE', 'PAYMENT', 'SYSTEM'],
        default: 'SYSTEM'
    },
    title: {
        type: String,
        required: true
    },
    body: {
        type: String
    },
    link: {
        type: String
    },
    isRead: {
        type: Boolean,
        default: false
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

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
