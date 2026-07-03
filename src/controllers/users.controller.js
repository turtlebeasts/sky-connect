const User = require("../models/User");

// Escape special regex characters
const escapeRegex = (text) => {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// GET /api/users/search?q=...
const searchUsers = async (req, res) => {
  try {
    const query = req.query.q?.trim();

    if (!query) {
      return res.status(200).json({
        users: [],
      });
    }

    const searchRegex = new RegExp(escapeRegex(query), "i");

    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [{ username: searchRegex }, { displayName: searchRegex }],
    })
      .select("username displayName avatar bio")
      .limit(20);

    res.status(200).json({
      users,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// GET /api/users/:username
// GET /api/users/:username
const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findOne({
      username: req.params.username.toLowerCase(),
    }).select("username displayName avatar bio createdAt followers following");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      user: {
        _id: user._id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.createdAt,
      },
      followersCount: user.followers.length,
      followingCount: user.following.length,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// PATCH /api/users/me
const updateProfile = async (req, res) => {
  try {
    const allowedFields = ["displayName", "bio", "avatar"];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      returnDocument: "after",
      runValidators: true,
    }).select("-password");

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/users/:username/follow
const followUser = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);

    const targetUser = await User.findOne({
      username: req.params.username.toLowerCase(),
    });

    if (!targetUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (currentUser._id.toString() === targetUser._id.toString()) {
      return res.status(400).json({
        message: "You cannot follow yourself.",
      });
    }

    const alreadyFollowing = currentUser.following.some(
      (id) => id.toString() === targetUser._id.toString(),
    );

    if (alreadyFollowing) {
      return res.status(400).json({
        message: "Already following this user.",
      });
    }

    currentUser.following.push(targetUser._id);
    targetUser.followers.push(currentUser._id);

    await currentUser.save();
    await targetUser.save();

    res.status(200).json({
      isFollowing: true,
      followersCount: targetUser.followers.length,
      followingCount: currentUser.following.length,
      message: "User followed successfully.",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// DELETE /api/users/:username/follow
const unfollowUser = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);

    const targetUser = await User.findOne({
      username: req.params.username.toLowerCase(),
    });

    if (!targetUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (currentUser._id.toString() === targetUser._id.toString()) {
      return res.status(400).json({
        message: "You cannot unfollow yourself.",
      });
    }

    const isFollowing = currentUser.following.some(
      (id) => id.toString() === targetUser._id.toString(),
    );

    if (!isFollowing) {
      return res.status(400).json({
        message: "You are not following this user.",
      });
    }

    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== targetUser._id.toString(),
    );

    targetUser.followers = targetUser.followers.filter(
      (id) => id.toString() !== currentUser._id.toString(),
    );

    await currentUser.save();
    await targetUser.save();

    res.status(200).json({
      isFollowing: false,
      followersCount: targetUser.followers.length,
      followingCount: currentUser.following.length,
      message: "User unfollowed successfully.",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// GET /api/users/:username/follow-status
// GET /api/users/:username/follow-status
const getFollowStatus = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id).select("following");

    const targetUser = await User.findOne({
      username: req.params.username.toLowerCase(),
    }).select("_id");

    if (!targetUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const isFollowing = currentUser.following.some(
      (id) => id.toString() === targetUser._id.toString(),
    );

    res.status(200).json({
      isFollowing,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// GET /api/users/:username/followers
const getFollowers = async (req, res) => {
  try {
    const user = await User.findOne({
      username: req.params.username.toLowerCase(),
    }).populate("followers", "username displayName avatar bio");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      followers: user.followers,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// GET /api/users/:username/following
const getFollowing = async (req, res) => {
  try {
    const user = await User.findOne({
      username: req.params.username.toLowerCase(),
    }).populate("following", "username displayName avatar bio");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      following: user.following,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  searchUsers,
  getPublicProfile,
  updateProfile,
  followUser,
  unfollowUser,
  getFollowStatus,
  getFollowers,
  getFollowing,
};
