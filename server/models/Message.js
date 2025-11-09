const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversationType: {
        type: String,
        enum: ['group', 'individual', 'guardian'],
        required: true
    },
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    senderRole: {
        type: String,
        enum: ['mentor', 'mentee', 'guardian'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    attachments: [{
        fileName: String,
        fileUrl: String,
        fileType: String,
        fileSize: Number
    }],
    isPinned: {
        type: Boolean,
        default: false
    },
    readBy: [{
        userId: mongoose.Schema.Types.ObjectId,
        readAt: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Message', messageSchema);