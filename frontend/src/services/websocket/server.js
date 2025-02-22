// services/websocket/server.js
import { WebSocketServer } from 'ws';
import { updateRiderLocation } from '../delivery/tracking';

const wss = new WebSocketServer({ port: process.env.WS_PORT || 8080 });

wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'LOCATION_UPDATE') {
        await updateRiderLocation(data.riderId, data.coordinates);
        // Broadcast to relevant clients
        wss.clients.forEach(client => {
          if (client.deliveryId === data.deliveryId) {
            client.send(JSON.stringify({
              type: 'RIDER_LOCATION',
              coordinates: data.coordinates
            }));
          }
        });
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});