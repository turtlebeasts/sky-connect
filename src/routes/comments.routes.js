const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth");

const {
  createComment,
  getPostComments,
  updateComment,
  deleteComment,
} = require("../controllers/comments.controller");

router.get("/:postId", getPostComments);

router.post("/:postId", authMiddleware, createComment);

router.patch("/:commentId", authMiddleware, updateComment);

router.delete("/:commentId", authMiddleware, deleteComment);

module.exports = router;
