import mongoose from 'mongoose';

const propertyInquirySchema = new mongoose.Schema({
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: true
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'ACTIVE', 'NEGOTIATING', 'AGREED', 'PURCHASED', 'CANCELLED', 'CLOSED'],
        default: 'PENDING'
    },
    initialMessage: {
        type: String
    },
    offeredPrice: {
        type: Number
    },
    agreedPrice: {
        type: Number
    },
    documentStatus: {
        type: String,
        enum: ['NONE', 'PENDING', 'APPROVED', 'REJECTED'],
        default: 'NONE'
    },
    documentUrl: {
        type: String
    },
    closedAt: {
        type: Date
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

const PropertyInquiry = mongoose.model('PropertyInquiry', propertyInquirySchema);

export default PropertyInquiry;
