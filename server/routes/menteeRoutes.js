const express = require('express');
const Mentee = require('../models/Mentee');
const LeaveRequest = require('../models/LeaveRequest');
const Grievance = require('../models/Grievance');
const { auth } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

// @route   GET /api/mentees/profile
// @desc    Get mentee profile
// @access  Private (Mentee only)
router.get('/profile', auth, roleCheck(['mentee']), async (req, res) => {
    try {
        const mentee = await Mentee.findOne({ userId: req.user._id })
            .populate('mentorId', 'fullName department phone');

        if (!mentee) {
            return res.status(404).json({ message: 'Mentee profile not found' });
        }

        res.json(mentee);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/mentees/dashboard
// @desc    Get mentee dashboard data
// @access  Private (Mentee only)
router.get('/dashboard', auth, roleCheck(['mentee']), async (req, res) => {
    try {
        const mentee = await Mentee.findOne({ userId: req.user._id });

        const totalLeaves = await LeaveRequest.countDocuments({ menteeId: mentee._id });
        const pendingLeaves = await LeaveRequest.countDocuments({
            menteeId: mentee._id,
            status: 'pending'
        });
        const approvedLeaves = await LeaveRequest.countDocuments({
            menteeId: mentee._id,
            status: 'approved'
        });

        const totalGrievances = await Grievance.countDocuments({ menteeId: mentee._id });
        const pendingGrievances = await Grievance.countDocuments({
            menteeId: mentee._id,
            status: 'pending'
        });

        // Get recent leave requests
        const recentLeaves = await LeaveRequest.find({ menteeId: mentee._id })
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            stats: {
                totalLeaves,
                pendingLeaves,
                approvedLeaves,
                totalGrievances,
                pendingGrievances,
                attendancePercentage: mentee.attendance.percentage
            },
            recentLeaves,
            attendance: mentee.attendance
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/mentees/:id/details
// @desc    Get detailed mentee information
// @access  Private (Mentor only)
router.get('/:id/details', auth, roleCheck(['mentor']), async (req, res) => {
    try {
        const mentee = await Mentee.findById(req.params.id)
            .populate('userId', 'email lastLogin')
            .populate('mentorId', 'fullName department')
            .populate({
                path: 'guardianIds',
                select: 'fullName relationship phone address profilePhoto',
                populate: {
                    path: 'userId',
                    select: 'email lastLogin'
                }
            });

        if (!mentee) {
            return res.status(404).json({ message: 'Mentee not found' });
        }

        // Format guardian data
        const guardians = mentee.guardianIds.map(guardian => ({
            _id: guardian._id,
            fullName: guardian.fullName,
            relationship: guardian.relationship,
            phone: guardian.phone,
            address: guardian.address,
            profilePhoto: guardian.profilePhoto,
            email: guardian.userId?.email,
            lastLogin: guardian.userId?.lastLogin
        }));

        // Generate sample attendance history for the last 12 months
        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];

        const attendanceHistory = months.map((month, index) => ({
            month,
            percentage: Math.floor(Math.random() * 30) + 70 // Random between 70-100%
        }));

        const menteeDetails = {
            ...mentee.toObject(),
            guardians,
            attendanceHistory
        };

        res.json(menteeDetails);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;