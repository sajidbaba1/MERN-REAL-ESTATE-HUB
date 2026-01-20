import mongoose from 'mongoose';

const pgRoomSchema = new mongoose.Schema({
    roomNumber: {
        type: String,
        required: [true, 'Room number is required']
    },
    description: {
        type: String
    },
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: true
    },
    roomType: {
        type: String,
        enum: ['PRIVATE', 'SHARED'],
        required: true
    },
    roomCategory: {
        type: String,
        enum: ['BOYS', 'GIRLS', 'FAMILY']
    },
    privateRoomPrice: {
        type: Number
    },
    bedPrice: {
        type: Number
    },
    totalBeds: {
        type: Number
    },
    availableBeds: {
        type: Number
    },
    roomSizeSqft: {
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

const PgRoom = mongoose.model('PgRoom', pgRoomSchema);

export default PgRoom;
