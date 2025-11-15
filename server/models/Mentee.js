const mongoose = require('mongoose');

const menteeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    mentorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mentor',
        required: true
    },
    guardianIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Guardian'
    }],
    fullName: {
        type: String,
        required: true
    },
    studentId: {
        type: String,
        required: true,
        unique: true
    },
    dateOfBirth: {
        type: Date
    },
    phone: {
        type: String,
        required: true
    },
    profilePhoto: {
        type: String,
        default: ''
    },
    class: {
        type: String,
        required: true
    },
    section: {
        type: String,
        required: true
    },
    academicYear: {
        type: String,
        required: true
    },
    marks: [{
        subject: String,
        score: Number,
        maxScore: Number,
        examType: String,
        date: Date
    }],
    attendance: {
        totalDays: { type: Number, default: 0 },
        presentDays: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 }
    },
    parentInfo: {
        fatherName: String,
        motherName: String,
        primaryContact: String,
        secondaryContact: String,
        email: String,
        emergencyContact: String
    },
    address: String,
    bloodGroup: String,
    medicalConditions: String,
    hobbies: [String]
}, {
    timestamps: true
});

module.exports = mongoose.model('Mentee', menteeSchema);