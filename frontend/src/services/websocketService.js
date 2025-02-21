// frontend/src/services/websocketService.js
import io from 'socket.io-client';
import useStore from '../store/realTimeStore';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.url = 'http://localhost:3001';
    this.store = useStore.getState();
  }

  connect() {
    if (!this.socket) {
      this.socket = io(this.url, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      });

      this.setupEventHandlers();
    }
    return this.socket;
  }

  setupEventHandlers() {
    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.store.setOnlineStatus(true);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      this.store.setOnlineStatus(false);
    });

    // Order events
    this.socket.on('order:new', (order) => {
      this.store.addOrder(order);
    });

    this.socket.on('order:update', (order) => {
      this.store.updateOrder(order);
    });

    // Table events
    this.socket.on('table:update', (table) => {
      this.store.updateTable(table);
    });

    // Menu events
    this.socket.on('menu:update', (menuItem) => {
      this.store.updateMenuItem(menuItem);
    });
  }

  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      // Handle offline case
      this.store.addToOfflineQueue({
        type: event,
        data,
        id: Date.now().toString()
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

const websocketService = new WebSocketService();
export default websocketService;