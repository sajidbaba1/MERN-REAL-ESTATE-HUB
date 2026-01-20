import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PropertyInquiry from './src/models/PropertyInquiry.js';
import User from './src/models/User.js';
import Property from './src/models/Property.js';

dotenv.config();

async function diagnose() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const totalInquiries = await PropertyInquiry.countDocuments();
        console.log('Total inquiries in DB:', totalInquiries);

        const inquiries = await PropertyInquiry.find({}).limit(10);
        console.log('Sample inquiries (last 10):');
        inquiries.forEach(i => {
            console.log(`Inquiry ID: ${i._id}, Owner: ${i.owner}, Client: ${i.client}, Property: ${i.property}, Status: ${i.status}`);
        });

        const users = await User.find({ role: 'AGENT' });
        console.log('\nAgent users:');
        users.forEach(u => {
            console.log(`User ID: ${u._id}, Name: ${u.firstName} ${u.lastName}, Email: ${u.email}`);
        });

        const properties = await Property.find({}).limit(10);
        console.log('\nSample properties (last 10):');
        properties.forEach(p => {
            console.log(`Property ID: ${p._id}, Title: ${p.title}, Owner: ${p.owner}`);
        });

        await mongoose.connection.close();
    } catch (err) {
        console.error('Diagnosis failed:', err);
    }
}

diagnose();
