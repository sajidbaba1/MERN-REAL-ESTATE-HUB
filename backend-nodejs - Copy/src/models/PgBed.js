import mongoose from 'mongoose';

const pgBedSchema = new mongoose.Schema({
    bedNumber: {
        type: String,
        required: [true, 'Bed number is required']
    },
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PgRoom',
        required: true
    },
    isOccupied: {
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

const PgBed = mongoose.model('PgBed', pgBedSchema);

export default PgBed;
