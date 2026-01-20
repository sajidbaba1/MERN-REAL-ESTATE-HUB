import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price must be positive']
    },
    address: {
        type: String,
        required: [true, 'Address is required']
    },
    city: {
        type: String,
        required: [true, 'City is required']
    },
    state: {
        type: String,
        required: [true, 'State is required']
    },
    zipCode: {
        type: String,
        required: [true, 'ZIP code is required']
    },
    latitude: {
        type: Number,
        default: null
    },
    longitude: {
        type: Number,
        default: null
    },
    bedrooms: {
        type: Number,
        required: [true, 'Bedrooms count is required'],
        min: [0, 'Bedrooms must be positive']
    },
    bathrooms: {
        type: Number,
        required: [true, 'Bathrooms count is required'],
        min: [0, 'Bathrooms must be positive']
    },
    squareFeet: {
        type: Number,
        required: [true, 'Square feet is required'],
        min: [0, 'Square feet must be positive']
    },
    propertyType: {
        type: String,
        enum: ['HOUSE', 'APARTMENT', 'CONDO', 'TOWNHOUSE', 'VILLA', 'LAND', 'FLAT', 'PG'],
        required: true
    },
    status: {
        type: String,
        enum: ['FOR_SALE', 'FOR_RENT', 'SOLD', 'RENTED'],
        required: true
    },
    approvalStatus: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING'
    },
    listingType: {
        type: String,
        enum: ['SALE', 'RENT', 'PG'],
        required: true
    },
    isPgListing: {
        type: Boolean,
        default: false
    },
    priceType: {
        type: String,
        enum: ['ONE_TIME', 'MONTHLY'],
        default: null
    },
    imageUrl: {
        type: String,
        default: null
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    location: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location',
        default: null
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

// Indexes for better query performance
propertySchema.index({ city: 1, state: 1 });
propertySchema.index({ approvalStatus: 1 });
propertySchema.index({ propertyType: 1 });
propertySchema.index({ status: 1 });
propertySchema.index({ owner: 1 });

const Property = mongoose.model('Property', propertySchema);

export default Property;
