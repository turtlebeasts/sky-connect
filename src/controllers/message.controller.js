const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const { getIO, getActiveConversation } = require("../sockets/index");

// POST /api/messages
const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, image = "" } = req.body;

    if (!conversationId) {
      return res.status(400).json({
        message: "Conversation is required.",
      });
    }

    if (!content?.trim() && !image) {
      return res.status(400).json({
        message: "Message cannot be empty.",
      });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found.",
      });
    }

    const isParticipant = conversation.participants.some(
      (participant) => participant.toString() === req.user._id.toString(),
    );

    if (!isParticipant) {
      return res.status(403).json({
        message: "Unauthorized.",
      });
    }

    // Find the receiver
    const receiverId = conversation.participants.find(
      (participant) => participant.toString() !== req.user._id.toString(),
    );

    // Is receiver currently viewing this conversation?
    const receiverActiveConversation = getActiveConversation(receiverId);

    const receiverIsViewing = receiverActiveConversation === conversationId;

    let message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      content: content?.trim() || "",
      image,
      readAt: receiverIsViewing ? new Date() : null,
    });

    conversation.lastMessage = message._id;
    conversation.lastMessageAt = message.createdAt;

    await conversation.save();

    message = await Message.findById(message._id).populate(
      "sender",
      "username displayName avatar",
    );

    const io = getIO();

    io.to(conversationId).emit("receive-message", message);

    // If receiver is already looking at this conversation,
    // notify sender immediately.
    if (receiverIsViewing) {
      io.to(conversationId).emit("messages-read", {
        conversationId,
        readerId: receiverId,
        readAt: message.readAt,
      });
    }

    res.status(201).json({
      message,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// GET /api/messages/:conversationId
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found.",
      });
    }

    const isParticipant = conversation.participants.some(
      (participant) => participant.toString() === req.user._id.toString(),
    );

    if (!isParticipant) {
      return res.status(403).json({
        message: "Unauthorized.",
      });
    }

    const messages = await Message.find({
      conversation: conversationId,
    })
      .populate("sender", "username displayName avatar")
      .sort({
        createdAt: 1,
      });

    res.status(200).json({
      messages,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// PATCH /api/messages/:conversationId/read
const markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found.",
      });
    }

    const isParticipant = conversation.participants.some(
      (participant) => participant.toString() === req.user._id.toString(),
    );

    if (!isParticipant) {
      return res.status(403).json({
        message: "Unauthorized.",
      });
    }

    const readAt = new Date();

    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: req.user._id },
        readAt: null,
      },
      {
        $set: {
          readAt,
        },
      },
    );

    const io = getIO();

    io.to(conversationId).emit("messages-read", {
      conversationId,
      readerId: req.user._id,
      readAt,
    });

    res.status(200).json({
      success: true,
      readAt,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  markMessagesAsRead,
};
