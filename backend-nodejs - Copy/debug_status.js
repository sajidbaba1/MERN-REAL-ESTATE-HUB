import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

async function checkUsersStatus() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({}).lean();
        console.log('User status check:');
        users.forEach(u => {
            console.log(`Email: ${u.email}, isEnabled: ${u.isEnabled}, enabled: ${u.enabled}`);
        });
        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}
checkUsersStatus();
