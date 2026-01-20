import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const email = 'ss2727303@gmail.com';

        let user = await User.findOne({ email });
        if (user) {
            console.log('User already exists');
        } else {
            user = new User({
                firstName: 'Sajid',
                lastName: 'Admin',
                email: email,
                password: 'password123', // Not really used for OTP but required by model
                role: 'ADMIN',
                isVerified: true,
                enabled: true
            });
            await user.save();
            console.log('User created successfully as ADMIN');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

seed();
