const { Message } = require('../models');
const { User, mongoose } = require('../models_mongo');
const MsgModel = mongoose.models.Message || mongoose.model('Message', new mongoose.Schema({}, { strict: false, timestamps: true }));
const Complaint = require('../models').Complaint;

// Send message (direct or complaint thread)
exports.sendMessage = async (req, res) => {
  try {
    const { threadType, complaintId, recipientId, content, mentions } = req.body;
    const senderId = req.currentUser.id;

    const doc = new MsgModel({
      threadType,
      complaintId: threadType === 'complaint' ? complaintId : null,
      senderId,
      recipientId: threadType === 'direct' ? recipientId : null,
      content,
      mentions: mentions || [],
      createdAt: new Date()
    });
    await doc.save();

    const sender = await User.findById(senderId).select('name email role').exec().catch(()=>null);
    const recipient = recipientId ? await User.findById(recipientId).select('name email role').exec().catch(()=>null) : null;

    const out = doc.toObject();
    out.sender = sender ? { id: sender._id || sender.id, name: sender.name, email: sender.email, role: sender.role } : null;
    out.recipient = recipient ? { id: recipient._id || recipient.id, name: recipient.name, email: recipient.email, role: recipient.role } : null;

    res.status(201).json({ success: true, message: out });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get messages for a thread (complaint or direct)
exports.getMessages = async (req, res) => {
  try {
    const { threadType, complaintId, otherUserId } = req.query;
    const userId = req.currentUser.id;
    const query = { threadType };

    if (threadType === 'complaint') query.complaintId = complaintId;
    else if (threadType === 'direct') query.$or = [
      { senderId: userId, recipientId: otherUserId },
      { senderId: otherUserId, recipientId: userId }
    ];

    const messages = await MsgModel.find(query).sort({ createdAt: 1 }).limit(100).lean().exec();
    // populate users
    const userIds = new Set();
    messages.forEach(m => { if(m.senderId) userIds.add(m.senderId.toString()); if(m.recipientId) userIds.add(m.recipientId.toString()); });
    const users = await User.find({ _id: { $in: Array.from(userIds) } }).select('name email role').lean().exec();
    const userMap = {};
    users.forEach(u => { userMap[(u._id||u.id).toString()] = u; });
    const out = messages.map(m => ({
      ...m,
      sender: userMap[(m.senderId||m.sender)||''] ? { id: (userMap[(m.senderId||m.sender)]._id||userMap[(m.senderId||m.sender)].id), name: userMap[(m.senderId||m.sender)].name, email: userMap[(m.senderId||m.sender)].email, role: userMap[(m.senderId||m.sender)].role } : null,
      recipient: userMap[(m.recipientId||m.recipient)||''] ? { id: (userMap[(m.recipientId||m.recipient)]._id||userMap[(m.recipientId||m.recipient)].id), name: userMap[(m.recipientId||m.recipient)].name, email: userMap[(m.recipientId||m.recipient)].email, role: userMap[(m.recipientId||m.recipient)].role } : null
    }));

    res.json({ success: true, messages: out });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get conversation list (direct messages)
exports.getConversations = async (req, res) => {
  try {
    const userId = req.currentUser.id;
    const messages = await MsgModel.find({ threadType: 'direct', $or: [{ senderId: userId }, { recipientId: userId }] }).sort({ createdAt: -1 }).limit(100).lean().exec();

    // Group by conversation partner
    const conversations = {};
    const userIds = new Set();
    messages.forEach(msg => { if(msg.senderId) userIds.add(msg.senderId.toString()); if(msg.recipientId) userIds.add(msg.recipientId.toString()); });
    const users = await User.find({ _id: { $in: Array.from(userIds) } }).select('name email role').lean().exec();
    const userMap = {};
    users.forEach(u => { userMap[(u._id||u.id).toString()] = u; });

    messages.forEach(msg => {
      const isSender = (msg.senderId && msg.senderId.toString()) === (userId && userId.toString());
      const otherId = isSender ? (msg.recipientId && msg.recipientId.toString()) : (msg.senderId && msg.senderId.toString());
      const otherUser = userMap[otherId];
      if(!otherUser) return;
      if(!conversations[otherId]){
        conversations[otherId] = {
          userId: otherId,
          userName: otherUser.name,
          userEmail: otherUser.email,
          userRole: otherUser.role,
          lastMessage: msg.content,
          lastMessageTime: msg.createdAt,
          unreadCount: 0
        };
      }
      if(!isSender && !msg.readAt){ conversations[otherId].unreadCount++; }
    });

    res.json({ success: true, conversations: Object.values(conversations) });
  } catch (error) {
    console.error('Error in getConversations:', error);
    res.status(500).json({ error: error.message });
  }
};

// Mark message as read
exports.markAsRead = async (req, res) => {
  try {
    const { messageId } = req.body;

    const m = await MsgModel.findById(messageId).exec();
    if(m){ m.readAt = new Date(); await m.save(); }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Edit message
exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.currentUser.id;

    const message = await MsgModel.findById(messageId).exec();
    if (!message || (message.senderId && message.senderId.toString()) !== (userId && userId.toString())) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    const sender = await User.findById(message.senderId).select('name email role').lean().exec().catch(()=>null);
    const out = message.toObject();
    out.sender = sender ? { id: (sender._id||sender.id), name: sender.name, email: sender.email, role: sender.role } : null;
    res.json({ success: true, message: out });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete message
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.currentUser.id;

    const message = await MsgModel.findById(messageId).exec();
    if (!message || (message.senderId && message.senderId.toString()) !== (userId && userId.toString())) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await message.remove();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Bulk mark conversation as read
exports.markConversationAsRead = async (req, res) => {
  try {
    const { otherUserId } = req.body;
    const userId = req.currentUser.id;
    let Op;
    try{ ({ Op } = require('sequelize')); }catch(e){ Op = {}; }

    await MsgModel.updateMany({ threadType: 'direct', senderId: otherUserId, recipientId: userId, readAt: null }, { $set: { readAt: new Date() } }).exec();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get messages where user was mentioned
exports.getMentions = async (req, res) => {
  try {
    const userId = req.currentUser.id;
    let Op, fn, col, literal;
    try{ ({ Op, fn, col, literal } = require('sequelize')); }catch(e){ Op = {}; fn = (...a)=>null; col = (c)=>c; literal = (v)=>v; }

    const messages = await Message.findAll({
      where: literal(`JSON_CONTAINS(mentions, '${userId}')`),
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'email', 'role'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.json({ success: true, mentions: messages });
  } catch (error) {
    console.error('Error in getMentions:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get unread message count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.currentUser.id;

    const count = await Message.count({
      where: {
        recipientId: userId,
        readAt: null
      }
    });

    res.json({ success: true, unreadCount: count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Send message to complaint thread
exports.sendComplaintMessage = async (req, res) => {
  try {
    const { complaintId, content, mentions } = req.body;
    const senderId = req.currentUser.id;

    // Verify complaint exists
    const complaint = await Complaint.findByPk(complaintId);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const message = await Message.create({
      threadType: 'complaint',
      complaintId,
      senderId,
      content,
      mentions: mentions || []
    });

    await message.reload({
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'email', 'role'] }
      ]
    });

    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get complaint thread messages
exports.getComplaintMessages = async (req, res) => {
  try {
    const { complaintId } = req.params;

    const messages = await Message.findAll({
      where: {
        threadType: 'complaint',
        complaintId
      },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'email', 'role'] }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
