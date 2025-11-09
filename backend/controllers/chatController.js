const Message = require('../models/message');
const Conversation = require('../models/conversation');

exports.createOrGetConversation = async (req, res) => {
  try {
    const userId = req.userId;
    const { senderId, receiverId } = req.body;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!senderId || !receiverId) return res.status(400).json({ message: 'senderId and receiverId required' });
    if (String(userId) !== String(senderId) && String(userId) !== String(receiverId)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    let conversation = await Conversation.findOne({ members: { $all: [senderId, receiverId] } });
    if (!conversation) {
      conversation = await Conversation.create({ members: [senderId, receiverId] });
    }

    return res.status(200).json(conversation);
  } catch (error) {
    console.error('createOrGetConversation error:', error);
    return res.status(500).json({ message: 'Failed to create or get conversation' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const userId = req.userId;
    const { senderId, receiverId, text, conversationId } = req.body;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!conversationId || !senderId || !receiverId || !text) {
      return res.status(400).json({ message: 'conversationId, senderId, receiverId and text required' });
    }
    if (String(userId) !== String(senderId)) return res.status(403).json({ message: 'Forbidden' });

    const conv = await Conversation.findById(conversationId);
    if (!conv || !conv.members.map(String).includes(String(userId))) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const message = await Message.create({ conversationId, senderId, receiverId, text });

    // emit via io if available (app set in server.js)
    const io = req.app.get('io');
    if (io) {
      io.to(String(senderId)).emit('receiveMessage', message);
      io.to(String(receiverId)).emit('receiveMessage', message);
    }

    return res.status(201).json(message);
  } catch (error) {
    console.error('sendMessage error:', error);
    return res.status(500).json({ message: 'Failed to send message' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const userId = req.userId;
    const { conversationId } = req.params;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!conversationId) return res.status(400).json({ message: 'conversationId is required' });

    const conv = await Conversation.findById(conversationId);
    if (!conv || !conv.members.map(String).includes(String(userId))) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
    return res.status(200).json(messages);
  } catch (error) {
    console.error('getMessages error:', error);
    return res.status(500).json({ message: 'Failed to get messages' });
  }
};