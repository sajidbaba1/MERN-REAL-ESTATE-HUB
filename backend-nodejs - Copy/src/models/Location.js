import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Location name is required'],
        unique: true,
        maxlength: [100, 'Location name must not exceed 100 characters'],
        trim: true
    },
    description: {
        type: String,
        maxlength: [500, 'Description must not exceed 500 characters'],
        trim: true
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

const Location = mongoose.model('Location', locationSchema);

export default Location;
