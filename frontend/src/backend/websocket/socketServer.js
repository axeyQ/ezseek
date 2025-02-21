// backend/websocket/socketServer.js
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Store active connections
let activeConnections = new Set();

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);
  activeConnections.add(socket.id);
  console.log(`Active connections: ${activeConnections.size}`);

  // Join KDS room
  socket.join('kds-room');
  console.log(`Socket ${socket.id} joined kds-room`);

  // Handle order status updates
  socket.on("order:status", (data) => {
    console.log('Received order:status event:', data);
    // Broadcast to all clients in KDS room
    io.to('kds-room').emit("order:update", data);
    console.log('Broadcasted order:update to kds-room');
  });

  // Handle new orders
  socket.on("order:new", (data) => {
    console.log('Received order:new event:', data);
    io.to('kds-room').emit("order:new", data);
    console.log('Broadcasted order:new to kds-room');
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
    activeConnections.delete(socket.id);
    console.log(`Active connections: ${activeConnections.size}`);
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});

// Add this to your socketServer.js
app.post('/emit', express.json(), (req, res) => {
  const { event, data } = req.body;
  io.to('kds-room').emit(event, data);
  console.log(`Emitted ${event} to kds-room:`, data);
  res.json({ success: true });
});