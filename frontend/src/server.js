// server.js
const express = require('express');
const http = require('http');
const next = require('next');
const WebSocketServer = require('./backend/websocket/socketServer');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  const httpServer = http.createServer(server);

  // Initialize WebSocket server
  const wsServer = new WebSocketServer(httpServer);

  // Middleware to attach WebSocket server to request object
  server.use((req, res, next) => {
    req.wsServer = wsServer;
    next();
  });

  server.all('*', (req, res) => {
    return handle(req, res);
  });

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});