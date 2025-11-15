const mongoose = require('mongoose');
const Mentee = require('../models/Mentee');
const Attendance = require('../models/Attendance');
require('dotenv').config();

const migrateAttendance = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get all mentees
        const mentees = await Mentee.find();
        console.log(`Found ${mentees.length} mentees`);

        // For each mentee, ensure their attendance stats are accurate
        for (const mentee of mentees) {
            const totalRecords = await Attendance.countDocuments({ menteeId: mentee._id });
            const presentRecords = await Attendance.countDocuments({ 
                menteeId: mentee._id, 
                status: 'present' 
            });

            const percentage = totalRecords > 0 
                ? Math.round((presentRecords / totalRecords) * 100) 
                : 0;

            await Mentee.findByIdAndUpdate(mentee._id, {
                'attendance.totalDays': totalRecords,
                'attendance.presentDays': presentRecords,
                'attendance.percentage': percentage
            });

            console.log(`Updated ${mentee.fullName}: ${presentRecords}/${totalRecords} (${percentage}%)`);
        }

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', er