import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({});
        console.log('--- ALL USERS ---');
        users.forEach(u => console.log(`${u.email} - ${u.role}`));

        const target = 'ss2727303@gmail.com';
        const exists = await User.findOne({ email: target });
        if (!exists) {
            console.log(`\nUser ${target} NOT found. Should I create it?`);
        } else {
            console.log(`\nUser ${target} exists with role ${exists.role}`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

check();
