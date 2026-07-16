const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth.routes");
const usersRoutes = require("./routes/users.routes");
const friendsRoutes = require("./routes/friends.routes");
const postRoutes = require("./routes/posts.routes");
const commentRoutes = require("./routes/comments.routes");
const conversationRoutes = require("./routes/conversation.routes");
const messageRoutes = require("./routes/message.routes");

const app = express();

app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.send(JSON.stringify({ message: "Ok", status: 200 }));
});
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/friends", friendsRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);

module.exports = app;
