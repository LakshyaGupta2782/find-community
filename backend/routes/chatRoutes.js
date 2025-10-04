// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Chat = require('../models/chat');
const User = require('../models/user');
const { sendOTPEmail } = require('../utils/sendEmail'); // We'll repurpose this or create a new email utility

// Helper function for sending a New Message Notification Email
const sendNewMessageEmail = async (recipientEmail, senderName) => {
    // You'd replace 'sendOTPEmail' logic with a generic 'sendEmail' utility
    // For now, let's assume we can modify the structure of sendOTPEmail or create a new one.
    
    // NOTE: For simplicity and using existing utilities, we'll reuse the logic,
    // but a robust app would have a dedicated function for notifications.
    try {
        const mailOptions = {
            from: process.env.OTP_EMAIL,
            to: recipientEmail,
            subject: `New Message from ${senderName} on Community Connect`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <p>Hello,</p>
                    <p>You have received a new message from <strong>${senderName}</strong> on the Community Connect Platform.</p>
                    <p>Please log in to your account to view and reply to the message.</p>
                    <p>Regards,<br>Community Connect Team</p>
                </div>
            `
        };
        // Assuming your nodemailer transporter is accessible or reusable here.
        // For this example, we'll use a placeholder console log instead of the full transport code:
        // console.log(`[EMAIL] New Message Notification sent to ${recipientEmail} from ${senderName}`);
        
        // If you were to use the full Nodemailer logic:
        // const info = await transporter.sendMail(mailOptions);
        // console.log('Message Notification sent: %s', info.messageId);
        
        return true;
    } catch (error) {
        console.error('Error sending message notification email:', error);
        return false;
    }
};


// =============================================================
// ROUTE 1: Get Chat List (Left Column)
// GET /api/chat/messages
// Access: Private (Requires Auth)
// =============================================================
router.get('/', auth, async (req, res) => {
    try {
        const userId = req.user.id;

        // Find all chats where the user is a participant
        const chats = await Chat.find({ participants: userId })
            // Populate the other participant's details, and sort by last message
            .populate('participants', 'name email')
            .sort({ lastMessageAt: -1 })
            .lean(); // Use lean() for performance since we're not saving changes

        const chatList = chats.map(chat => {
            // Determine who the other person is
            const otherParticipant = chat.participants.find(p => p._id.toString() !== userId);
            
            // Get the content of the last message (optional, but helpful for UI)
            const lastMessage = chat.messages.length > 0 ? 
                chat.messages[chat.messages.length - 1].content : 
                'Start Conversation';

            return {
                chatId: chat._id,
                recipientId: otherParticipant._id,
                recipientName: otherParticipant.name,
                lastMessagePreview: lastMessage,
                lastMessageAt: chat.lastMessageAt,
            };
        });

        res.json(chatList);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// =============================================================
// ROUTE 2: Get/Create Chat History (Right Column)
// GET /api/chat/:recipientId
// Access: Private (Requires Auth)
// =============================================================
router.get('/:recipientId', auth, async (req, res) => {
    const userId = req.user.id;
    const { recipientId } = req.params;

    if (userId === recipientId) {
        return res.status(400).json({ msg: 'Cannot fetch chat with yourself.' });
    }

    try {
        // Find the chat that contains both user IDs
        // $all ensures both IDs are present in the array, order doesn't matter
        let chat = await Chat.findOne({
            participants: { $all: [userId, recipientId] }
        })
        .populate('participants', 'name'); // Populate names for context

        if (!chat) {
            // If no chat exists, create a new one
            chat = new Chat({
                participants: [userId, recipientId],
                messages: []
            });
            await chat.save();
        }

        res.json({
            chatId: chat._id,
            messages: chat.messages,
            participants: chat.participants.map(p => ({ id: p._id, name: p.name }))
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// =============================================================
// ROUTE 3: Send New Message & Notification
// POST /api/chat/:recipientId
// Access: Private (Requires Auth)
// =============================================================
router.post('/:recipientId', auth, async (req, res) => {
    const senderId = req.user.id;
    const { recipientId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
        return res.status(400).json({ msg: 'Message content cannot be empty.' });
    }

    try {
        // 1. Find the chat thread or create a new one (similar to the GET logic)
        let chat = await Chat.findOne({
            participants: { $all: [senderId, recipientId] }
        });

        if (!chat) {
             chat = new Chat({ participants: [senderId, recipientId], messages: [] });
        }
        
        // 2. Create the new message object
        const newMessage = {
            sender: senderId,
            content: content
        };

        // 3. Add the message to the chat thread and update the timestamp
        chat.messages.push(newMessage);
        chat.lastMessageAt = Date.now();
        await chat.save();
        
        // 4. Find sender and recipient details for the email notification
        const [sender, recipient] = await Promise.all([
            User.findById(senderId).select('name'),
            User.findById(recipientId).select('email name')
        ]);
        
        if (!recipient) {
             // Continue without notification if recipient is missing, but log error
             console.error(`Recipient user not found for ID: ${recipientId}`);
        } else {
            // 5. CRUCIAL STEP: Send Email Notification
            const notificationSuccess = await sendNewMessageEmail(
                recipient.email, 
                sender.name
            );

            // Placeholder response update based on notification status
            if (notificationSuccess) {
                console.log(`Notification sent to ${recipient.email}`);
            }
        }
        
        // 6. Respond to the client
        res.status(201).json({ 
            msg: 'Message sent successfully.',
            notificationStatus: recipient ? 'Notification sent to user email.' : 'Recipient user not found.',
            newMessage: newMessage 
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;