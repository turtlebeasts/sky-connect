const express = require("express");
const {
  register,
  login,
  getMe,
  googleLogin,
} = require("../controllers/auth.controller");
const protect = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.post("/google", googleLogin);

module.exports = router;
