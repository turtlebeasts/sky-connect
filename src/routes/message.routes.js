const express = require("express");

const {
  sendMessage,
  getMessages,
  markMessagesAsRead,
} = require("../controllers/message.controller");

const protect = require("../middleware/auth");

const router = express.Router();

// Get all messages of a conversation
router.get("/:conversationId", protect, getMessages);

// Mark conversation messages as read
router.patch("/:conversationId/read", protect, markMessagesAsRead);

// Send a new message
router.post("/", protect, sendMessage);

module.exports = router;
