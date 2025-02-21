// services/websocket/socketService.js
const { Server } = require('socket.io');
const realTimeService = require('../redis/realTimeService');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedClients = new Map();
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
      }
    });

    this.setupEventHandlers();
    this.subscribeToRedisEvents();
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Store client information
      this.connectedClients.set(socket.id, {
        socket,
        roles: socket.handshake.auth.roles || []
      });

      // Handle client role registration
      socket.on('register_role', (role) => {
        const clientInfo = this.connectedClients.get(socket.id);
        if (clientInfo) {
          clientInfo.roles.push(role);
          this.connectedClients.set(socket.id, clientInfo);
        }
      });

      // Handle table status updates
      socket.on('table_status_update', async (data) => {
        try {
          await realTimeService.updateTableStatus(data.tableId, data.status);
          socket.emit('table_status_updated', { success: true });
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      // Handle order updates
      socket.on('order_update', async (data) => {
        try {
          await realTimeService.updateOrderStatus(data.orderId, data.status);
          socket.emit('order_updated', { success: true });
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      // Handle KDS updates
      socket.on('kds_update', async (data) => {
        try {
          await realTimeService.updateKDS(data);
          socket.emit('kds_updated', { success: true });
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      // Handle client disconnection
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        this.connectedClients.delete(socket.id);
      });
    });
  }

  subscribeToRedisEvents() {
    // Subscribe to table updates
    realTimeService.subscribe('table-updates', (data) => {
      this.broadcastToRole('staff', 'table_status_changed', data);
    });

    // Subscribe to order updates
    realTimeService.subscribe('order-updates', (data) => {
      this.broadcastToRole('kitchen', 'order_status_changed', data);
    });

    // Subscribe to KDS updates
    realTimeService.subscribe('kds-updates', (data) => {
      this.broadcastToRole('kitchen', 'kds_updated', data);
    });
  }

  // Broadcast to specific roles
  broadcastToRole(role, event, data) {
    for (const [_, clientInfo] of this.connectedClients) {
      if (clientInfo.roles.includes(role)) {
        clientInfo.socket.emit(event, data);
      }
    }
  }

  // Broadcast to all clients
  broadcastToAll(event, data) {
    this.io.emit(event, data);
  }

  // Send to specific client
  sendToClient(socketId, event, data) {
    const clientInfo = this.connectedClients.get(socketId);
    if (clientInfo) {
      clientInfo.socket.emit(event, data);
    }
  }
}

module.exports = new SocketService();