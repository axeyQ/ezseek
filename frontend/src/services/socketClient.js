// frontend/src/services/socketClient.js
import { io } from 'socket.io-client';

class SocketClient {
  constructor() {
    this.socket = null;
    this.handlers = new Map();
  }

  connect(role = 'staff') {
    this.socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001', {
      auth: { roles: [role] }
    });

    this.setupEventHandlers();
    return this;
  }

  setupEventHandlers() {
    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Handle table updates
    this.socket.on('table_status_changed', (data) => {
      const handlers = this.handlers.get('table_status_changed') || [];
      handlers.forEach(handler => handler(data));
    });

    // Handle order updates
    this.socket.on('order_status_changed', (data) => {
      const handlers = this.handlers.get('order_status_changed') || [];
      handlers.forEach(handler => handler(data));
    });

    // Handle KDS updates
    this.socket.on('kds_updated', (data) => {
      const handlers = this.handlers.get('kds_updated') || [];
      handlers.forEach(handler => handler(data));
    });
  }

  // Subscribe to events
  on(event, handler) {
    const handlers = this.handlers.get(event) || [];
    handlers.push(handler);
    this.handlers.set(event, handlers);
  }

  // Unsubscribe from events
  off(event, handler) {
    const handlers = this.handlers.get(event) || [];
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
      this.handlers.set(event, handlers);
    }
  }

  // Update table status
  updateTableStatus(tableId, status) {
    this.socket.emit('table_status_update', { tableId, status });
  }

  // Update order status
  updateOrderStatus(orderId, status) {
    this.socket.emit('order_update', { orderId, status });
  }

  // Update KDS
  updateKDS(orderData) {
    this.socket.emit('kds_update', orderData);
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketClient = new SocketClient();