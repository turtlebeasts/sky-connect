const express = require("express");
const {
  sendRequest,
  getIncomingRequests,
  getFriends,
  acceptRequest,
  declineRequest,
  blockUser,
} = require("../controllers/friends.controller");
const protect = require("../middleware/auth");

const router = express.Router();

router.use(protect); // every friends route requires auth

router.post("/request", sendRequest);
router.get("/requests", getIncomingRequests);
router.get("/", getFriends);
router.post("/:id/accept", acceptRequest);
router.post("/:id/decline", declineRequest);
router.post("/:id/block", blockUser);

module.exports = router;
