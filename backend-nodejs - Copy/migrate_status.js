import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

async function migrateStatus() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({});
        console.log(`Checking ${users.length} users...`);

        for (const user of users) {
            // If enabled is undefined and isEnabled exists, migrate it
            // Since we renamed the field in the model, u.isEnabled might be inaccessible via standard means if strict is on, 
            // but u.get('isEnabled') should work.
            const oldVal = user.get('isEnabled');
            if (oldVal !== undefined) {
                user.enabled = oldVal;
                // Remove the old field
                user.set('isEnabled', undefined);
                await user.save();
                console.log(`Migrated status for ${user.email}: ${oldVal}`);
            } else if (user.enabled === undefined) {
                // Fallback to true if both are missing
                user.enabled = true;
                await user.save();
                console.log(`Set default enabled:true for ${user.email}`);
            }
        }

        await mongoose.connection.close();
        console.log('Migration complete!');
    } catch (err) {
        console.error(err);
    }
}
migrateStatus();
