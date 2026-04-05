const mongoose = require('mongoose');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');

const run = async () => {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
        console.error('MONGODB_URI is not set. Skipping seed check.');
        process.exit(1);
    }

    try {
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10000,
        });

        const usersCount = await User.countDocuments();

        if (usersCount === 0) {
            console.log('No users found in database. Running initial seed...');
            await mongoose.connection.close();

            execSync('node scripts/seed.js', {
                cwd: path.resolve(__dirname, '..'),
                stdio: 'inherit',
                env: process.env,
            });
        } else {
            console.log(`Seed skipped: found ${usersCount} existing users.`);
        }
    } catch (error) {
        console.error('Seed-if-empty check failed:', error.message);
        process.exit(1);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
    }
};

run();
