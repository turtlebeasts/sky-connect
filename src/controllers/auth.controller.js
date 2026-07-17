const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { verifyGoogleToken } = require("../services/googleAuth.service");

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    const existingUser = await User.findOne({
      username: username.toLowerCase(),
    });
    if (existingUser) {
      return res.status(400).json({ message: "Username already taken" });
    }

    const user = await User.create({
      username,
      email,
      password,
      displayName: displayName || username,
      authProvider: "local",
    });

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    const user = await User.findOne({
      username: username.toLowerCase(),
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials.",
      });
    }

    if (!user.password) {
      return res.status(400).json({
        message:
          "This account doesn't have a password. Please continue with Google.",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/google
const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        message: "Google token is required.",
      });
    }

    // Verify token with Google
    const googleUser = await verifyGoogleToken(token);

    if (!googleUser.emailVerified) {
      return res.status(401).json({
        message: "Google email is not verified.",
      });
    }

    // Find existing user by email
    let user = await User.findOne({
      email: googleUser.email,
    });

    // ==========================
    // Existing account
    // ==========================
    if (user) {
      // Link Google account if not already linked
      if (!user.googleId) {
        user.googleId = googleUser.googleId;
      }

      user.authProvider = "google";

      // Update avatar only if user still has default avatar
      if (!user.avatar || user.avatar.includes("blank-profile-picture")) {
        user.avatar = googleUser.avatar;
      }

      await user.save();
    }

    // ==========================
    // New account
    // ==========================
    else {
      let username = googleUser.email.split("@")[0].toLowerCase();

      let originalUsername = username;
      let count = 1;

      while (await User.findOne({ username })) {
        username = `${originalUsername}${count++}`;
      }

      user = await User.create({
        username,
        displayName: googleUser.displayName,
        email: googleUser.email,
        avatar: googleUser.avatar,
        googleId: googleUser.googleId,
        authProvider: "google",
      });
    }

    const jwt = generateToken(user._id);

    res.status(200).json({
      token: jwt,
      user: {
        _id: user._id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(401).json({
      message: "Google authentication failed.",
    });
  }
};
// GET /api/auth/me
const getMe = async (req, res) => {
  res.status(200).json({ user: req.user });
};

module.exports = { register, login, googleLogin, getMe };
