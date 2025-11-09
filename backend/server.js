// ...existing code...
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

// Models (only require when needed elsewhere)
const Message = require("./models/message");

// App setup
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Basic test route
app.get("/", (req, res) => {
  res.send("Community Connect Platform Backend API");
});

// Import routes
const authRoutes = require("./routes/authRoutes");
const communityRoutes = require("./routes/communityRoutes");
const chatRoutes = require("./routes/chatRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/chat", chatRoutes);

// make io available to controllers via app
app.set("io", io);

// Socket.io logic: room per user and targeted emits
io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  // client should emit 'userOnline' with their userId after connecting
  socket.on("userOnline", (userId) => {
    if (!userId) return;
    socket.join(String(userId));
    console.log(`socket ${socket.id} joined room ${userId}`);
  });

  // Handle sending messages from sockets; save and emit only to involved users
  socket.on("sendMessage", async (data) => {
    try {
      const { conversationId, senderId, receiverId, text } = data;
      if (!conversationId || !senderId || !receiverId || !text) {
        return socket.emit("errorMessage", { message: "Invalid message payload" });
      }

      const saved = await Message.create({ conversationId, senderId, receiverId, text });

      // emit saved message to sender and receiver rooms only
      io.to(String(saved.senderId)).emit("receiveMessage", saved);
      io.to(String(saved.receiverId)).emit("receiveMessage", saved);
    } catch (err) {
      console.error("❌ Error saving message:", err);
      socket.emit("errorMessage", { message: "Message save failed" });
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
// ...existing code...