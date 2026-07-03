const Friendship = require("../models/Friendship");
const User = require("../models/User");

// POST /api/friends/request  { username }
const sendRequest = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    const recipient = await User.findOne({ username: username.toLowerCase() });
    if (!recipient) {
      return res.status(404).json({ message: "User not found" });
    }

    if (recipient._id.equals(req.user._id)) {
      return res.status(400).json({ message: "You can't friend yourself" });
    }

    // check if a friendship already exists in either direction
    const existing = await Friendship.findOne({
      $or: [
        { requester: req.user._id, recipient: recipient._id },
        { requester: recipient._id, recipient: req.user._id },
      ],
    });

    if (existing) {
      return res
        .status(400)
        .json({ message: `Friendship already ${existing.status}` });
    }

    const friendship = await Friendship.create({
      requester: req.user._id,
      recipient: recipient._id,
      status: "pending",
    });

    res.status(201).json({ friendship });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/friends/requests  (incoming pending requests)
const getIncomingRequests = async (req, res) => {
  try {
    const requests = await Friendship.find({
      recipient: req.user._id,
      status: "pending",
    }).populate("requester", "username displayName avatar");

    res.status(200).json({ requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/friends  (accepted friends)
const getFriends = async (req, res) => {
  try {
    const friendships = await Friendship.find({
      status: "accepted",
      $or: [{ requester: req.user._id }, { recipient: req.user._id }],
    })
      .populate("requester", "username displayName avatar")
      .populate("recipient", "username displayName avatar");

    const friends = friendships.map((f) => {
      const isRequester = f.requester._id.equals(req.user._id);
      return isRequester ? f.recipient : f.requester;
    });

    res.status(200).json({ friends });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/friends/:id/accept
const acceptRequest = async (req, res) => {
  try {
    const friendship = await Friendship.findOne({
      _id: req.params.id,
      recipient: req.user._id,
      status: "pending",
    });

    if (!friendship) {
      return res.status(404).json({ message: "Request not found" });
    }

    friendship.status = "accepted";
    await friendship.save();

    res.status(200).json({ friendship });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/friends/:id/decline
const declineRequest = async (req, res) => {
  try {
    const friendship = await Friendship.findOne({
      _id: req.params.id,
      recipient: req.user._id,
      status: "pending",
    });

    if (!friendship) {
      return res.status(404).json({ message: "Request not found" });
    }

    friendship.status = "declined";
    await friendship.save();

    res.status(200).json({ friendship });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/friends/:id/block
const blockUser = async (req, res) => {
  try {
    // :id here is the OTHER USER's id, not a friendship id
    const otherUserId = req.params.id;

    let friendship = await Friendship.findOne({
      $or: [
        { requester: req.user._id, recipient: otherUserId },
        { requester: otherUserId, recipient: req.user._id },
      ],
    });

    if (friendship) {
      friendship.status = "blocked";
      friendship.requester = req.user._id; // normalize: blocker becomes requester
      friendship.recipient = otherUserId;
      await friendship.save();
    } else {
      friendship = await Friendship.create({
        requester: req.user._id,
        recipient: otherUserId,
        status: "blocked",
      });
    }

    res.status(200).json({ friendship });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  sendRequest,
  getIncomingRequests,
  getFriends,
  acceptRequest,
  declineRequest,
  blockUser,
};
