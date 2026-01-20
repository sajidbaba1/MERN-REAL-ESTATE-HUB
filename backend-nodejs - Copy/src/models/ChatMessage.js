import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
    inquiry: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PropertyInquiry',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    messageType: {
        type: String,
        enum: ['TEXT', 'PRICE_OFFER', 'PRICE_COUNTER', 'PRICE_ACCEPT', 'PRICE_REJECT', 'SYSTEM', 'PURCHASE_REQUEST', 'PURCHASE_CONFIRM', 'DOCUMENT', 'DOCUMENT_DECISION'],
        default: 'TEXT'
    },
    content: {
        type: String
    },
    priceAmount: {
        type: Number
    },
    attachmentUrl: {
        type: String
    },
    attachmentType: {
        type: String
    },
    sentAt: {
        type: Date,
        default: Date.now
    },
    readAt: {
        type: Date
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, {
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

// Index for faster message retrieval by inquiry
chatMessageSchema.index({ inquiry: 1 });
chatMessageSchema.index({ createdAt: 1 });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

export default ChatMessage;
