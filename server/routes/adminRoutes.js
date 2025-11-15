const express = require('express');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Mentor = require('../models/Mentor');
const Mentee = require('../models/Mentee');
const Group = require('../models/Group');
const LeaveRequest = require('../models/LeaveRequest');
const { auth } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard data
// @access  Private (Admin only)
router.get('/dashboard', auth, roleCheck(['admin']), async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalMentors = await Mentor.countDocuments();
        const totalMentees = await Mentee.countDocuments();
        const totalGroups = await Group.countDocuments({ isArchived: false });
        const pendingLeaves = await LeaveRequest.countDocuments({ status: 'pending' });
        const activeUsers = await User.countDocuments({ isActive: true });

        // Get recent activities
        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('email role createdAt');

        const recentLeaves = await LeaveRequest.find()
            .populate('menteeId', 'fullName studentId')
            .populate('mentorId', 'fullName')
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            stats: {
                totalUsers,
                totalMentors,
                totalMentees,
                totalGroups,
                pendingLeaves,
                activeUsers
            },
            recentUsers,
            recentLeaves
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/users
// @desc    Get all users with pagination
// @access  Private (Admin only)
router.get('/users', auth, roleCheck(['admin']), async (req, res) => {
    try {
        const { page = 1, limit = 10, role, search } = req.query;

        let query = {};
        if (role && role !== 'all') {
            query.role = role;
        }

        // Enhanced search - search by email only at User level
        // Profile-level search will be done after fetching
        if (search) {
            query.email = { $regex: search, $options: 'i' };
        }

        const users = await User.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .select('-password');

        const total = await User.countDocuments(query);

        // Get profile data for each user
        const usersWithProfiles = await Promise.all(
            users.map(async (user) => {
                let profile = null;
                if (user.role === 'mentor') {
                    profile = await Mentor.findOne({ userId: user._id });
                } else if (user.role === 'mentee') {
                    profile = await Mentee.findOne({ userId: user._id });
                } else if (user.role === 'admin') {
                    profile = await Admin.findOne({ userId: user._id });
                }
                return { ...user.toObject(), profile };
            })
        );

        res.json({
            users: usersWithProfiles,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/mentors
// @desc    Get all mentors
// @access  Private (Admin only)
router.get('/mentors', auth, roleCheck(['admin']), async (req, res) => {
    try {
        const mentors = await Mentor.find()
            .populate('userId', 'email isActive lastLogin')
            .sort({ fullName: 1 });

        // Get mentee count for each mentor
        const mentorsWithStats = await Promise.all(
            mentors.map(async (mentor) => {
                const menteeCount = await Mentee.countDocuments({ mentorId: mentor._id });
                const groupCount = await Group.countDocuments({ mentorId: mentor._id, isArchived: false });
                return {
                    ...mentor.toObject(),
                    stats: { menteeCount, groupCount }
                };
            })
        );

        res.json(mentorsWithStats);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/mentees
// @desc    Get all mentees
// @access  Private (Admin only)
router.get('/mentees', auth, roleCheck(['admin']), async (req, res) => {
    try {
        const mentees = await Mentee.find()
            .populate('userId', 'email isActive lastLogin')
            .populate('mentorId', 'fullName')
            .sort({ fullName: 1 });

        res.json(mentees);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/admin/assign-mentor
// @desc    Assign or reassign mentor to mentee
// @access  Private (Admin only)
router.put('/assign-mentor', auth, roleCheck(['admin']), async (req, res) => {
    try {
        const { menteeId, mentorId } = req.body;

        const mentee = await Mentee.findByIdAndUpdate(
            menteeId,
            { mentorId },
            { new: true }
        ).populate('mentorId', 'fullName');

        if (!mentee) {
            return res.status(404).json({ message: 'Mentee not found' });
        }

        res.json({ message: 'Mentor assigned successfully', mentee });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user and associated profile
// @access  Private (Admin only)
router.delete('/users/:id', auth, roleCheck(['admin']), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Delete associated profile
        if (user.role === 'mentor') {
            await Mentor.findOneAndDelete({ userId: user._id });
            // Reassign mentees to null (unassigned)
            await Mentee.updateMany({ mentorId: user._id }, { mentorId: null });
        } else if (user.role === 'mentee') {
            await Mentee.findOneAndDelete({ userId: user._id });
        } else if (user.role === 'admin') {
            await Admin.findOneAndDelete({ userId: user._id });
        }

        await User.findByIdAndDelete(req.params.id);

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/admin/users/:id/toggle-status
// @desc    Toggle user active status
// @access  Private (Admin only)
router.put('/users/:id/toggle-status', auth, roleCheck(['admin']), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isActive = !user.isActive;
        await user.save();

        res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`, user });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user basic info
// @access  Private (Admin only)
router.put('/users/:id', auth, roleCheck(['admin']), async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { email },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/admin/users/:id/profile
// @desc    Update user profile
// @access  Private (Admin only)
router.put('/users/:id/profile', auth, roleCheck(['admin']), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let updatedProfile;

        if (user.role === 'admin') {
            updatedProfile = await Admin.findOneAndUpdate(
                { userId: req.params.id },
                req.body,
                { new: true }
            );
        } else if (user.role === 'mentor') {
            updatedProfile = await Mentor.findOneAndUpdate(
                { userId: req.params.id },
                req.body,
                { new: true }
            );
        } else if (user.role === 'mentee') {
            updatedProfile = await Mentee.findOneAndUpdate(
                { userId: req.params.id },
                req.body,
                { new: true }
            );
        }

        if (!updatedProfile) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        res.json({ message: 'Profile updated successfully', profile: updatedProfile });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/reports/overview
// @desc    Get system overview reports
// @access  Private (Admin only)
router.get('/reports/overview', auth, roleCheck(['admin']), async (req, res) => {
    try {
        // User registration trends (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const userTrends = await User.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Leave statistics
        const leaveStats = await LeaveRequest.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Attendance overview
        const attendanceStats = await Mentee.aggregate([
            {
                $group: {
                    _id: null,
                    avgAttendance: { $avg: "$attendance.percentage" },
                    totalStudents: { $sum: 1 }
                }
            }
        ]);

        res.json({
            userTrends,
            leaveStats,
            attendanceStats: attendanceStats[0] || { avgAttendance: 0, totalStudents: 0 }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/users/:id/details
// @desc    Get detailed user information
// @access  Private (Admin only)
router.get('/users/:id/details', auth, roleCheck(['admin']), async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let profile;
        if (user.role === 'admin') {
            profile = await Admin.findOne({ userId: req.params.id });
        } else if (user.role === 'mentor') {
            profile = await Mentor.findOne({ userId: req.params.id });
        } else if (user.role === 'mentee') {
            profile = await Mentee.findOne({ userId: req.params.id });
        }

        res.json({
            ...profile?.toObject(),
            userId: user
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/admin/users/:id/details
// @desc    Update detailed user information
// @access  Private (Admin only)
router.put('/users/:id/details', auth, roleCheck(['admin']), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let updatedProfile;
        if (user.role === 'admin') {
            updatedProfile = await Admin.findOneAndUpdate(
                { userId: req.params.id },
                req.body,
                { new: true, upsert: true }
            );
        } else if (user.role === 'mentor') {
            updatedProfile = await Mentor.findOneAndUpdate(
                { userId: req.params.id },
                req.body,
                { new: true, upsert: true }
            );
        } else if (user.role === 'mentee') {
            updatedProfile = await Mentee.findOneAndUpdate(
                { userId: req.params.id },
                req.body,
                { new: true, upsert: true }
            );
        }

        res.json({
            ...updatedProfile?.toObject(),
            userId: user
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/attendance
// @desc    Get attendance data for date/month
// @access  Private (Admin only)
router.get('/attendance', auth, roleCheck(['admin']), async (req, res) => {
    try {
        const { date, month, year } = req.query;

        // For now, return sample data - in production, this would query an Attendance model
        const mentees = await Mentee.find().select('_id fullName studentId class section');

        // Generate sample attendance data
        const attendanceData = {};
        mentees.forEach(mentee => {
            attendanceData[mentee._id] = {};

            if (date) {
                // Single date - random attendance
                attendanceData[mentee._id][date] = Math.random() > 0.2 ? 'present' : 'absent';
            } else if (month && year) {
                // Monthly data - generate for each day
                const daysInMonth = new Date(year, month, 0).getDate();
                for (let day = 1; day <= daysInMonth; day++) {
                    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    attendanceData[mentee._id][dateStr] = Math.random() > 0.2 ? 'present' : 'absent';
                }
            }
        });

        res.json(attendanceData);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/admin/attendance
// @desc    Save attendance data
// @access  Private (Admin only)
router.post('/attendance', auth, roleCheck(['admin']), async (req, res) => {
    try {
        const { date, attendanceData } = req.body;

        // In production, this would save to an Attendance model
        // For now, we'll update the mentee attendance statistics

        for (const [menteeId, attendance] of Object.entries(attendanceData)) {
            if (attendance[date]) {
                const mentee = await Mentee.findById(menteeId);
                if (mentee) {
                    // Update attendance statistics
                    const isPresent = attendance[date] === 'present';

                    if (isPresent) {
                        mentee.attendance.presentDays = (mentee.attendance.presentDays || 0) + 1;
                    }
                    mentee.attendance.totalDays = (mentee.attendance.totalDays || 0) + 1;
                    mentee.attendance.percentage = Math.round(
                        (mentee.attendance.presentDays / mentee.attendance.totalDays) * 100
                    );

                    await mentee.save();
                }
            }
        }

        res.json({ message: 'Attendance saved successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;