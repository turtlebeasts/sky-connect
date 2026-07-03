const express = require("express");
const {
  searchUsers,
  getPublicProfile,
  updateProfile,
  followUser,
  unfollowUser,
  getFollowStatus,
  getFollowing,
  getFollowers,
} = require("../controllers/users.controller");
const protect = require("../middleware/auth");

const router = express.Router();

// Protected search
router.get("/search", protect, searchUsers);

// Public profile
router.get("/:username", getPublicProfile);

// Update own profile
router.patch("/me", protect, updateProfile);

router.post("/:username/follow", protect, followUser);

router.delete("/:username/follow", protect, unfollowUser);

router.get("/:username/follow-status", protect, getFollowStatus);

router.get("/:username/followers", protect, getFollowers);
router.get("/:username/following", protect, getFollowing);

module.exports = router;
