import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './src/models/User.js';

dotenv.config();

async function testApi() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ email: 'agent@demo.com' });

        if (!user) {
            console.log('User not found');
            return;
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        console.log('JWT Token for Agent User:');
        console.log(token);
        console.log('\nRun this command to test the endpoint:');
        console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:8889/api/inquiries/owner`);

        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}
testApi();
