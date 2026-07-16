require("dotenv").config();

const http = require("http");

const app = require("./app");
const connectDB = require("./config/db");

const { initializeSocket } = require("./sockets/index");

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

initializeSocket(server);

connectDB();

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
