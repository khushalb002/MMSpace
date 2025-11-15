const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Mentee = require('../models/Mentee');
const Mentor = require('../models/Mentor');
const { auth } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

// Configure multer for CSV file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/csv');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Helper function to generate default password
const generateDefaultPassword = (rollNo) => {
    return `${rollNo}@123`;
};

// Helper function to validate email
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Helper function to validate phone number
const isValidPhone = (phone) => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone?.replace(/\s+/g, ''));
};

// @route   POST /api/csv/upload-students
// @desc    Upload CSV file with student data
// @access  Private (Admin only)
router.post('/upload-students', auth, roleCheck(['admin']), upload.single('csvFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const results = [];
        const errors = [];
        let rowNumber = 1;

        // Parse CSV file
        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on('data', (data) => {
                rowNumber++;
                results.push({ ...data, rowNumber });
            })
            .on('end', async () => {
                try {
                    const processedData = {
                        success: [],
                        failed: [],
                        updated: []
                    };

                    // Process each row
                    for (const row of results) {
                        try {
                            // Log raw row data for debugging
                            console.log('Processing row:', row.rowNumber, 'Raw data:', row);

                            // Extract and validate fields (handle various column name formats)
                            const rollNo = (row.rollNo || row.rollno || row.RollNo || row.ROLLNO || '').trim();
                            const studentEmail = (row.studentEmail || row.student_email || row.email || '').trim();
                            const studentPhone = (row.studentPhone || row.student_phone || row.phone || '').trim();
                            const parentsPhone = (row.parentsPhone || row.parents_phone || row.parentPhone || row.parent_phone || '').trim();
                            const parentsEmail = (row.parentsEmail || row.parents_email || row.parentEmail || row.parent_email || '').trim();
                            const mentorEmail = (row.mentorEmail || row.mentor_email || '').trim();
                            const fullName = (row.fullName || row.full_name || row.name || row.studentName || row.student_name || '').trim();
                            const className = (row.class || row.className || row.Class || row.grade || '').trim();
                            const section = (row.section || row.Section || '').trim();

                            console.log('Extracted fields:', {
                                rollNo,
                                fullName,
                                studentEmail,
                                studentPhone,
                                className,
                                section,
                                parentsPhone,
                                parentsEmail,
                                mentorEmail
                            });

                            // Validation
                            if (!rollNo) {
                                errors.push({ row: row.rowNumber, error: 'Roll number is required' });
                                processedData.failed.push({ row: row.rowNumber, data: row, error: 'Roll number is required' });
                                continue;
                            }

                            if (!studentEmail || !isValidEmail(studentEmail)) {
                                errors.push({ row: row.rowNumber, error: 'Valid student email is required' });
                                processedData.failed.push({ row: row.rowNumber, data: row, error: 'Valid student email is required' });
                                continue;
                            }

                            if (!studentPhone || !isValidPhone(studentPhone)) {
                                errors.push({ row: row.rowNumber, error: 'Valid student phone number is required (10 digits)' });
                                processedData.failed.push({ row: row.rowNumber, data: row, error: 'Valid student phone number is required' });
                                continue;
                            }

                            // Find or create mentor
                            let mentor = null;
                            if (mentorEmail && isValidEmail(mentorEmail)) {
                                const mentorUser = await User.findOne({ email: mentorEmail.toLowerCase(), role: 'mentor' });
                                if (mentorUser) {
                                    mentor = await Mentor.findOne({ userId: mentorUser._id });
                                }
                            }

                            // Check if student already exists
                            const existingUser = await User.findOne({ email: studentEmail.toLowerCase() });

                            if (existingUser) {
                                // Update existing student
                                const mentee = await Mentee.findOne({ userId: existingUser._id });

                                if (mentee) {
                                    // Update mentee details
                                    mentee.phone = studentPhone.replace(/\s+/g, '');
                                    mentee.studentId = rollNo;

                                    // Update all provided fields
                                    if (fullName) {
                                        mentee.fullName = fullName;
                                    }
                                    if (className) {
                                        mentee.class = className;
                                    }
                                    if (section) {
                                        mentee.section = section;
                                    }
                                    if (mentor) {
                                        mentee.mentorId = mentor._id;
                                    }

                                    // Update parent info
                                    mentee.parentInfo = mentee.parentInfo || {};
                                    if (parentsPhone) {
                                        mentee.parentInfo.primaryContact = parentsPhone.replace(/\s+/g, '');
                                    }
                                    if (parentsEmail && isValidEmail(parentsEmail)) {
                                        mentee.parentInfo.email = parentsEmail.toLowerCase();
                                    }

                                    console.log('Updating mentee:', {
                                        fullName: mentee.fullName,
                                        studentId: mentee.studentId,
                                        phone: mentee.phone,
                                        class: mentee.class,
                                        section: mentee.section
                                    });

                                    await mentee.save();
                                    processedData.updated.push({
                                        row: row.rowNumber,
                                        rollNo,
                                        email: studentEmail,
                                        message: 'Updated successfully'
                                    });
                                }
                            } else {
                                // Create new student
                                const defaultPassword = generateDefaultPassword(rollNo);

                                // Create user account
                                const newUser = new User({
                                    email: studentEmail.toLowerCase(),
                                    password: defaultPassword,
                                    role: 'mentee',
                                    isActive: true
                                });

                                await newUser.save();

                                // Create mentee profile
                                const menteeData = {
                                    userId: newUser._id,
                                    fullName: fullName || rollNo,
                                    studentId: rollNo,
                                    phone: studentPhone.replace(/\s+/g, ''),
                                    class: className || 'Not Assigned',
                                    section: section || 'Not Assigned',
                                    academicYear: new Date().getFullYear().toString(),
                                    parentInfo: {
                                        primaryContact: parentsPhone ? parentsPhone.replace(/\s+/g, '') : '',
                                        email: parentsEmail && isValidEmail(parentsEmail) ? parentsEmail.toLowerCase() : ''
                                    }
                                };

                                // Only add mentorId if mentor exists
                                if (mentor) {
                                    menteeData.mentorId = mentor._id;
                                }

                                console.log('Creating mentee with data:', {
                                    fullName: menteeData.fullName,
                                    studentId: menteeData.studentId,
                                    phone: menteeData.phone,
                                    class: menteeData.class,
                                    section: menteeData.section
                                });

                                const newMentee = new Mentee(menteeData);
                                await newMentee.save();

                                processedData.success.push({
                                    row: row.rowNumber,
                                    rollNo,
                                    email: studentEmail,
                                    defaultPassword,
                                    message: 'Created successfully'
                                });
                            }
                        } catch (rowError) {
                            console.error(`Error processing row ${row.rowNumber}:`, rowError);
                            processedData.failed.push({
                                row: row.rowNumber,
                                data: row,
                                error: rowError.message
                            });
                        }
                    }

                    // Delete uploaded file
                    fs.unlinkSync(req.file.path);

                    res.json({
                        message: 'CSV processing completed',
                        summary: {
                            total: results.length,
                            created: processedData.success.length,
                            updated: processedData.updated.length,
                            failed: processedData.failed.length
                        },
                        details: processedData
                    });
                } catch (error) {
                    console.error('Error processing CSV:', error);
                    // Clean up file on error
                    if (fs.existsSync(req.file.path)) {
                        fs.unlinkSync(req.file.path);
                    }
                    res.status(500).json({ message: 'Error processing CSV file', error: error.message });
                }
            })
            .on('error', (error) => {
                console.error('CSV parsing error:', error);
                // Clean up file on error
                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                res.status(500).json({ message: 'Error parsing CSV file', error: error.message });
            });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Error uploading file', error: error.message });
    }
});

// @route   GET /api/csv/template
// @desc    Download CSV template
// @access  Private (Admin only)
router.get('/template', auth, roleCheck(['admin']), (req, res) => {
    const csvContent = 'rollNo,fullName,studentEmail,studentPhone,parentsPhone,parentsEmail,mentorEmail,class,section\r\n' +
        'STU001,John Doe,john.doe@example.com,9876543210,9876543211,parent@example.com,mentor@example.com,10,A\r\n' +
        'STU002,Jane Smith,jane.smith@example.com,9876543212,9876543213,parent2@example.com,mentor@example.com,10,A\r\n' +
        'STU003,Mike Johnson,mike.johnson@example.com,9876543214,9876543215,parent3@example.com,mentor@example.com,10,B';

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=student_upload_template.csv');
    res.send(csvContent);
});

module.exports = router;
