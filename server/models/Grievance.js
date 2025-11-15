const mongoose = require('mongoose');

const grievanceSchema = new mongoose.Schema({
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
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    rollNo: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    grievanceType: {
        type: String,
        enum: [
            'misconduct-complaint',
            'user-experience',
            'billing-payment',
            'communication-support',
            'administrative-issues',
            'technical-issues',
            'other'
        ],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    dateOfIncident: {
        type: Date,
        required: true
    },
    attachments: [String],
    status: {
        type: String,
        enum: ['pending', 'in-review', 'resolved', 'rejected'],
        default: 'pending'
    },
    mentorComments: {
        type: String,
        default: ''
    },
    adminComments: {
        type: String,
        default: ''
    },
    resolution: {
        type: String,
        default: ''
    },
    studentResolutionConfirmation: {
        type: String,
        enum: ['pending', 'yes', 'no'],
        default: 'pending'
    },
    studentFeedback: {
        type: String,
        default: ''
    },
    reviewedAt: Date,
    resolvedAt: Date,
    studentConfirmedAt: Date
}, {
    timestamps: true
});

module.exports = mongoose.model('Grievance', grievanceSchema);