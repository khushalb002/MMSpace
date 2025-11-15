const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
    menteeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mentee',
        required: true
    },
    mentorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mentor',
        required: true
    },
    leaveType: {
        type: String,
        enum: ['sick', 'casual', 'emergency', 'vacation'],
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    daysCount: {
        type: Number,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    attachments: [String],
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    mentorComments: {
        type: String,
        default: ''
    },
    reviewedAt: Date,
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);