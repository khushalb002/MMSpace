const express = require('express');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Mentor = require('../models/Mentor');
const Mentee = require('../models/Mentee');
const Group = require('../models/Group');
const LeaveRequest = require('../models/LeaveRequest');
const Attendance = require('../models/Attendance');
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

        const mentees = await Mentee.find().select('_id fullName studentId class section');
        const attendanceData = {};

        if (date) {
            // Get attendance for a specific date
            const attendanceRecords = await Attendance.find({
                date: new Date(date)
            });

            mentees.forEach(mentee => {
                attendanceData[mentee._id] = {};
                const record = attendanceRecords.find(r => r.menteeId.toString() === mentee._id.toString());
                attendanceData[mentee._id][date] = record ? record.status : null;
            });
        } else if (month && year) {
            // Get attendance for entire month
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);

            const attendanceRecords = await Attendance.find({
                date: { $gte: startDate, $lte: endDate }
            });

            mentees.forEach(mentee => {
                attendanceData[mentee._id] = {};
                const daysInMonth = endDate.getDate();

                for (let day = 1; day <= daysInMonth; day++) {
                    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const record = attendanceRecords.find(r =>
                        r.menteeId.toString() === mentee._id.toString() &&
                        r.date.toISOString().split('T')[0] === dateStr
                    );
                    attendanceData[mentee._id][dateStr] = record ? record.status : null;
                }
            });
        }

        res.json(attendanceData);
    } catch (error) {
        console.error('Error fetching attendance:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/admin/attendance
// @desc    Save attendance data
// @access  Private (Admin only)
router.post('/attendance', auth, roleCheck(['admin']), async (req, res) => {
    try {
        const { date, attendanceData } = req.body;
        const attendanceDate = new Date(date);

        for (const [menteeId, attendance] of Object.entries(attendanceData)) {
            if (attendance[date]) {
                const status = attendance[date];

                // Upsert attendance record
                await Attendance.findOneAndUpdate(
                    { menteeId, date: attendanceDate },
                    {
                        menteeId,
                        date: attendanceDate,
                        status,
                        markedBy: req.user.id
                    },
                    { upsert: true, new: true }
                );

                // Update mentee attendance statistics
                const totalRecords = await Attendance.countDocuments({ menteeId });
                const presentRecords = await Attendance.countDocuments({
                    menteeId,
                    status: 'present'
                });

                const percentage = totalRecords > 0
                    ? Math.round((presentRecords / totalRecords) * 100)
                    : 0;

                await Mentee.findByIdAndUpdate(menteeId, {
                    'attendance.totalDays': totalRecords,
                    'attendance.presentDays': presentRecords,
                    'attendance.percentage': percentage
                });
            }
        }

        res.json({ message: 'Attendance saved successfully' });
    } catch (error) {
        console.error('Error saving attendance:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/attendance/stats/:menteeId
// @desc    Get attendance statistics for a specific mentee
// @access  Private (Admin only)
router.get('/attendance/stats/:menteeId', auth, roleCheck(['admin']), async (req, res) => {
    try {
        const { menteeId } = req.params;
        const { startDate, endDate } = req.query;

        const query = { menteeId };
        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const records = await Attendance.find(query).sort({ date: 1 });
        const totalDays = records.length;
        const presentDays = records.filter(r => r.status === 'present').length;
        const absentDays = records.filter(r => r.status === 'absent').length;
        const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

        res.json({
            totalDays,
            presentDays,
            absentDays,
            percentage,
            records
        });
    } catch (error) {
        console.error('Error fetching attendance stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/admin/profile
// @desc    Update admin profile
// @access  Private (Admin only)
router.put('/profile', auth, roleCheck(['admin']), async (req, res) => {
    try {
        const { fullName, phone, department, position } = req.body;

        const admin = await Admin.findOne({ userId: req.user.id });
        if (!admin) {
            return res.status(404).json({ message: 'Admin profile not found' });
        }

        // Update admin fields
        if (fullName) admin.fullName = fullName;
        if (phone) admin.phone = phone;
        if (department) admin.department = department;
        if (position) admin.position = position;

        await admin.save();

        // Update user email if provided in request body
        if (req.body.email && req.body.email !== req.user.email) {
            await User.findByIdAndUpdate(req.user.id, { email: req.body.email });
        }

        res.json({ message: 'Profile updated successfully', admin });
    } catch (error) {
        console.error('Error updating admin profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;