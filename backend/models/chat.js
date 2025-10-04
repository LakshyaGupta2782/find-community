// models/Chat.js
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    sender: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    content: { 
        type: String, 
        required: true,
        trim: true
    },
    timestamp: { 
        type: Date, 
        default: Date.now 
    }
});

const ChatSchema = new mongoose.Schema({
    // Participants array must contain exactly two user IDs
    participants: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        required: true,
        validate: [v => v.length === 2, 'A chat must have exactly two participants.']
    },
    messages: [MessageSchema],
    lastMessageAt: { 
        type: Date, 
        default: Date.now 
    }
}, { timestamps: true });

// Create a unique index to ensure only one chat exists between any two users
ChatSchema.index({ participants: 1 }, { unique: true });

module.exports = mongoose.model('Chat', ChatSchema);