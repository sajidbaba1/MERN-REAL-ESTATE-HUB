import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PropertyInquiry from './src/models/PropertyInquiry.js';
import User from './src/models/User.js';
import Property from './src/models/Property.js';

dotenv.config();

async function createTestInquiry() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const agent = await User.findOne({ email: 'agent@demo.com' });
        const client = await User.findOne({ email: 'user@demo.com' });
        const property = await Property.findOne({ owner: agent._id });

        if (!agent || !client || !property) {
            console.log('Missing data for test inquiry creation');
            return;
        }

        const inquiry = await PropertyInquiry.create({
            property: property._id,
            client: client._id,
            owner: agent._id,
            status: 'ACTIVE',
            initialMessage: 'I am very interested in this property owned by the agent!'
        });

        console.log('Created test inquiry for Agent User:', inquiry._id);
        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}
createTestInquiry();
