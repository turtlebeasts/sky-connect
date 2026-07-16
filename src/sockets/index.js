const { Server } = require("socket.io");
const socketAuth = require("./auth");

let io;

// userId -> conversationId
const activeConversations = new Map();

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  io.use(socketAuth);

  io.on("connection", (socket) => {
    // User opens a conversation
    socket.on("join-conversation", (conversationId) => {
      socket.join(conversationId);

      activeConversations.set(socket.user._id.toString(), conversationId);
    });

    // User leaves a conversation
    socket.on("leave-conversation", (conversationId) => {
      socket.leave(conversationId);

      const current = activeConversations.get(socket.user._id.toString());

      if (current === conversationId) {
        activeConversations.delete(socket.user._id.toString());
      }
    });

    socket.on("typing", ({ conversationId }) => {
      socket.to(conversationId).emit("user-typing", {
        conversationId,
        userId: socket.user._id,
      });
    });

    socket.on("stop-typing", ({ conversationId }) => {
      socket.to(conversationId).emit("user-stop-typing", {
        conversationId,
        userId: socket.user._id,
      });
    });

    socket.on("disconnect", () => {
      activeConversations.delete(socket.user._id.toString());
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }

  return io;
};

const getActiveConversation = (userId) => {
  return activeConversations.get(userId.toString()) || null;
};

module.exports = {
  initializeSocket,
  getIO,
  getActiveConversation,
};
