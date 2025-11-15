const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Import models
const User = require('../models/User');
const Mentee = require('../models/Mentee');
const Guardian = require('../models/Guardian');
const Mentor = require('../models/Mentor');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('Database connection error:', error.message);
        process.exit(1);
    }
};

const addMenteeWithGuardian = async () => {
    try {
        await connectDB();

        // Find a mentor to assign the mentee to
        const mentor = await Mentor.findOne();
        if (!mentor) {
            console.error('No mentor found. Please create a mentor first.');
            process.exit(1);
        }

        // Create mentee user
        const menteeUser = new User({
            email: 'testmentee@example.com',
            password: 'password123',
            role: 'mentee'
        });
        await menteeUser.save();

        // Create mentee profile
        const mentee = new Mentee({
            userId: menteeUser._id,
            mentorId: mentor._id,
            fullName: 'Test Student',
            studentId: 'STU' + Date.now(),
            dateOfBirth: new Date('2010-05-15'),
            phone: '+919876543210',
            class: '8',
            section: 'B',
            academicYear: '2024-2025',
            address: '123 Test Street, Test City',
            attendance: {
                totalDays: 100,
                presentDays: 92,
                percentage: 92
            }
        });
        await mentee.save();

        // Create guardian user
        const guardianUser = new User({
            email: 'testguardian@example.com',
            password: 'password123',
            role: 'guardian'
        });
        await guardianUser.save();

        // Create guardian profile
        const guardian = new Guardian({
            userId: guardianUser._id,
            fullName: 'Test Parent',
            phone: '+919876543211',
            relationship: 'Father',
            address: '123 Test Street, Test City',
            menteeIds: [mentee._id]
        });
        await guardian.save();

        // Update mentee with guardian reference
        mentee.guardianIds = [guardian._id];
        await mentee.save();

        console.log('Successfully created:');
        console.log(`- Mentee: ${mentee.fullName} (${mentee.studentId})`);
        console.log(`  Email: ${menteeUser.email}`);
        console.log(`  Password: password123`);
        console.log(`- Guardian: ${guardian.fullName}`);
        console.log(`  Email: ${guardianUser.email}`);
        console.log(`  Password: password123`);
        console.log(`  Relationship: ${guardian.relationship}`);
        console.log(`  Phone: ${guardian.phone}`);
        console.log('\nYou can now log in as the mentor and view the student details to see the guardian information.');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

addMenteeWithGuardian();
