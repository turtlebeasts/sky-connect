const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");
const authMiddleware = require("../middleware/auth");

const {
  createPost,
  getFeedPosts,
  getUserPosts,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
} = require("../controllers/posts.controller");

// Public Routes
router.get("/", getFeedPosts);
router.get("/user/:username", getUserPosts);
router.get("/:id", getPostById);

// Protected Routes
router.post("/", authMiddleware, upload.single("image"), createPost);
router.patch("/:id", authMiddleware, updatePost);
router.delete("/:id", authMiddleware, deletePost);
router.post("/:id/like", authMiddleware, likePost);
router.delete("/:id/like", authMiddleware, unlikePost);

module.exports = router;
