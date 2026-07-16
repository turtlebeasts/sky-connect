const express = require("express");

const {
  createConversation,
  getConversations,
  getConversationById,
} = require("../controllers/conversation.controller");

const protect = require("../middleware/auth");

const router = express.Router();

// Get all conversations of the logged-in user
router.get("/", protect, getConversations);

// Create a new conversation or return an existing one
router.post("/", protect, createConversation);

// Get a single conversation by ID
router.get("/:id", protect, getConversationById);

module.exports = router;
