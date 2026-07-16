const Conversation = require("../models/Conversation");
const User = require("../models/User");

// POST /api/conversations
const createConversation = async (req, res) => {
  try {
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({
        message: "Participant is required.",
      });
    }

    if (participantId === req.user._id.toString()) {
      return res.status(400).json({
        message: "You cannot start a conversation with yourself.",
      });
    }

    const participant = await User.findById(participantId);

    if (!participant) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const participants = [req.user._id, participantId].sort();

    let conversation = await Conversation.findOne({
      participants: { $all: participants },
    })
      .populate("participants", "username displayName avatar")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "username displayName avatar",
        },
      });

    if (conversation) {
      return res.status(200).json({
        conversation,
      });
    }

    conversation = await Conversation.create({
      participants,
    });

    conversation = await Conversation.findById(conversation._id)
      .populate("participants", "username displayName avatar")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "username displayName avatar",
        },
      });

    res.status(201).json({
      conversation,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// GET /api/conversations
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate("participants", "username displayName avatar")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "username displayName avatar",
        },
      })
      .sort({
        lastMessageAt: -1,
      });

    res.status(200).json({
      conversations,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// GET /api/conversations/:id
const getConversationById = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate("participants", "username displayName avatar")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "username displayName avatar",
        },
      });

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found.",
      });
    }

    const isParticipant = conversation.participants.some(
      (participant) => participant._id.toString() === req.user._id.toString(),
    );

    if (!isParticipant) {
      return res.status(403).json({
        message: "Unauthorized.",
      });
    }

    res.status(200).json({
      conversation,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createConversation,
  getConversations,
  getConversationById,
};
