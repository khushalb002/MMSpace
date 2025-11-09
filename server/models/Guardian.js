const mongoose = require('mongoose');

const guardianSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
        },
        phone: {
            type: String,
            default: '',
            trim: true,
        },
        relationship: {
            type: String,
            default: 'Parent',
            trim: true,
        },
        menteeIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Mentee',
                required: true,
            },
        ],
        address: {
            type: String,
            default: '',
            trim: true,
        },
        notes: {
            type: String,
            default: '',
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

guardianSchema.index({ userId: 1 }, { unique: true });

guardianSchema.index({ menteeIds: 1 });

module.exports = mongoose.model('Guardian', guardianSchema);
