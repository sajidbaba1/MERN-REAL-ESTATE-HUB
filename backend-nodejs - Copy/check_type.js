import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PropertyInquiry from './src/models/PropertyInquiry.js';

dotenv.config();

async function checkType() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const inquiry = await PropertyInquiry.findOne({});
        if (inquiry) {
            console.log('Inquiry ID:', inquiry._id);
            console.log('Owner value:', inquiry.owner);
            console.log('Owner type:', typeof inquiry.owner);
            console.log('Is owner ObjectId?', inquiry.owner instanceof mongoose.Types.ObjectId);

            // Raw check
            const raw = await mongoose.connection.db.collection('propertyinquiries').findOne({ _id: inquiry._id });
            console.log('Raw owner type in MongoDB:', typeof raw.owner);
            console.log('Raw owner value:', raw.owner);
        } else {
            console.log('No inquiries found');
        }
        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}
checkType();
