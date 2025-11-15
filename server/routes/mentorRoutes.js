const express = require('express');
const Mentor = require('../models/Mentor');
const Mentee = require('../models/Mentee');
const Group = require('../models/Group');
const LeaveRequest = require('../models/LeaveRequest');
const Grievance = require('../models/Grievance');
const { auth } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { safeFindOne, safeFind, safeCount, executeMultipleWithRetry } = require('../utils/dbUtils');

const router = express.Router();

// @route   GET /api/mentors/profile
// @desc    Get mentor profile
// @access  Private (Mentor only)
router.get('/profile', auth, roleCheck(['mentor']), async (req, res) => {
    try {
        const mentor = await safeFindOne(Mentor, { userId: req.user._id });
        if (!mentor) {
            return res.status(404).json({ message: 'Mentor profile not found' });
        }
        res.json(mentor);
    } catch (error) {
        console.error('Error fetching mentor profile:', error);
        res.status(500).json({ message: 'Failed to fetch mentor profile' });
    }
});

// @route   GET /api/mentors/mentees
// @desc    Get all mentees assigned to mentor
// @access  Private (Mentor only)
router.get('/mentees', auth, roleCheck(['mentor']), async (req, res) => {
    try {
        const mentor = await safeFindOne(Mentor, { userId: req.user._id });
        if (!mentor) {
            return res.status(404).json({ message: 'Mentor profile not found' });
        }

        const mentees = await safeFind(Mentee, { mentorId: mentor._id }, {
            populate: 'userId'
        });

        res.json(mentees);
    } catch (error) {
        console.error('Error fetching mentees:', error);
        res.status(500).json({ message: 'Failed to fetch mentees' });
    }
});

// @route   GET /api/mentors/guardians
// @desc    Get all guardians of mentees assigned to mentor
// @access  Private (Mentor only)
router.get('/guardians', auth, roleCheck(['mentor']), async (req, res) => {
    try {
        const Guardian = require('../models/Guardian');
        
        const mentor = await safeFindOne(Mentor, { userId: req.user._id });
        if (!mentor) {
            return res.status(404).json({ message: 'Mentor profile not found' });
        }

        // Get all mentees assigned to this mentor
        const mentees = await safeFind(Mentee, { mentorId: mentor._id });
        const menteeIds = mentees.map(m => m._id);

        // Find all guardians who have at least one mentee assigned to this mentor
        const guardians = await Guardian.find({
            menteeIds: { $in: menteeIds }
        })
            .populate('userId', 'email')
            .populate('menteeIds', 'fullName class section')
            .lean();

        // Filter to only include mentees that belong to this mentor
        const enrichedGuardians = guardians.map(guardian => ({
            ...guardian,
            menteeIds: guardian.menteeIds.filter(mentee => 
                menteeIds.some(id => id.toString() === mentee._id.toString())
            )
        })).filter(guardian => guardian.menteeIds.length > 0);

        res.json(enrichedGuardians);
    } catch (error) {
        console.error('Error fetching guardians:', error);
        res.status(500).json({ message: 'Failed to fetch guardians' });
    }
});

// @route   PUT /api/mentors/profile
// @desc    Update mentor profile
// @access  Private (Mentor only)
router.put('/profile', auth, roleCheck(['mentor']), async (req, res) => {
    try {
        const { email, phone, qualifications, citations } = req.body;
        
        // Find mentor profile
        const mentor = await Mentor.findOne({ userId: req.user._id });
        if (!mentor) {
            return res.status(404).json({ message: 'Mentor profile not found' });
        }

        // Update mentor fields
        if (phone !== undefined) mentor.phone = phone;
        if (qualifications !== undefined) mentor.qualifications = qualifications;
        if (citations !== undefined) mentor.citations = citations;

        await mentor.save();

        // Update email in User model if provided
        if (email && email !== req.user.email) {
            const User = require('../models/User');
            const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
            
            if (existingUser) {
                return res.status(400).json({ message: 'Email already in use' });
            }

            await User.findByIdAndUpdate(req.user._id, { email });
        }

        // Fetch updated mentor with user data
        const updatedMentor = await Mentor.findOne({ userId: req.user._id })
            .populate('userId', 'email');

        res.json({ 
            message: 'Profile updated successfully', 
            mentor: updatedMentor 
        });
    } catch (error) {
        console.error('Error updating mentor profile:', error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        res.status(500).json({ message: 'Failed to update profile' });
    }
});

// @route   GET /api/mentors/dashboard
// @desc    Get mentor dashboard data
// @access  Private (Mentor only)
router.get('/dashboard', auth, roleCheck(['mentor']), async (req, res) => {
    try {
        let retries = 3;
        let mentor, totalMentees, totalGroups, pendingLeaves, totalGrievances, recentLeaves, mentees;

        while (retries > 0) {
            try {
                mentor = await Mentor.findOne({ userId: req.user._id }).lean();

                if (!mentor) {
                    return res.status(404).json({ message: 'Mentor profile not found' });
                }

                // Execute all queries with proper error handling
                [totalMentees, totalGroups, pendingLeaves, totalGrievances, recentLeaves, mentees] = await Promise.all([
                    Mentee.countDocuments({ mentorId: mentor._id }),
                    Group.countDocuments({ mentorId: mentor._id, isArchived: false }),
                    LeaveRequest.countDocuments({
                        mentorId: mentor._id,
                        status: 'pending'
                    }),
                    Grievance.countDocuments({
                        mentorId: mentor._id,
                        status: { $in: ['pending', 'in-review'] }
                    }),
                    LeaveRequest.find({ mentorId: mentor._id })
                        .populate('menteeId', 'fullName studentId')
                        .sort({ createdAt: -1 })
                        .limit(5)
                        .lean(),
                    Mentee.find({ mentorId: mentor._id })
                        .populate('userId', 'email lastLogin')
                        .sort({ fullName: 1 })
                        .limit(10)
                        .lean()
                ]);

                break;
            } catch (dbError) {
                retries--;
                if (retries === 0) {
                    console.error('Database error in mentor dashboard:', dbError);
                    return res.status(500).json({ message: 'Database connection error' });
                }
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }

        res.json({
            stats: {
                totalMentees,
                totalGroups,
                pendingLeaves,
                totalGrievances
            },
            recentLeaves,
            mentees
        });
    } catch (error) {
        console.error('Error in mentor dashboard:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;