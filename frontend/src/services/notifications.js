// frontend/src/services/notifications.js
export class NotificationService {
    constructor() {
      this.permission = null;
      this.supported = 'Notification' in window;
    }
  
    async initialize() {
      if (!this.supported) return false;
      
      if (Notification.permission === 'granted') {
        this.permission = 'granted';
        return true;
      }
      
      try {
        const result = await Notification.requestPermission();
        this.permission = result;
        return result === 'granted';
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
        return false;
      }
    }
  
    async sendNotification(title, options = {}) {
      if (!this.supported || this.permission !== 'granted') return;
  
      try {
        return new Notification(title, {
          icon: '/notification-icon.png',
          ...options
        });
      } catch (error) {
        console.error('Failed to send notification:', error);
      }
    }
  
    async notifyRiderAssigned(delivery, rider) {
      return this.sendNotification('Rider Assigned', {
        body: `${rider.name} has been assigned to delivery #${delivery.trackingId}`,
        tag: `delivery-${delivery._id}`
      });
    }
  
    async notifyDeliveryStatus(delivery) {
      const status = getDeliveryStatus(delivery);
      return this.sendNotification('Delivery Update', {
        body: `Delivery #${delivery.trackingId} is ${status.label}: ${status.description}`,
        tag: `delivery-${delivery._id}`
      });
    }
  }
  