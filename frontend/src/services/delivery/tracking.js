// services/delivery/tracking.js
import Rider from '../../../../database/models/Rider';
import Delivery from '../../../../database/models/Delivery';
import { calculateOptimalRoute } from '../olaMapService';

export async function updateRiderLocation(riderId, coordinates) {
  try {
    const rider = await Rider.findByIdAndUpdate(
      riderId,
      {
        'currentLocation.coordinates': coordinates
      },
      { new: true }
    );

    if (rider.currentDelivery) {
      const delivery = await Delivery.findById(rider.currentDelivery);
      // Recalculate ETA if needed
      const route = await calculateOptimalRoute(
        coordinates,
        delivery.dropLocation.coordinates
      );
      
      await Delivery.findByIdAndUpdate(
        delivery._id,
        { estimatedTime: route.duration }
      );
    }

    return rider;
  } catch (error) {
    console.error('Error updating rider location:', error);
    throw error;
  }
}

export async function assignRiderToDelivery(deliveryId, riderId) {
  try {
    const [delivery, rider] = await Promise.all([
      Delivery.findById(deliveryId),
      Rider.findById(riderId)
    ]);

    if (!delivery || !rider) {
      throw new Error('Delivery or rider not found');
    }

    if (rider.status !== 'AVAILABLE') {
      throw new Error('Rider is not available');
    }

    // Calculate initial route
    const route = await calculateOptimalRoute(
      rider.currentLocation.coordinates,
      delivery.pickupLocation.coordinates
    );

    await Promise.all([
      Delivery.findByIdAndUpdate(deliveryId, {
        rider: riderId,
        status: 'ASSIGNED',
        estimatedTime: route.duration
      }),
      Rider.findByIdAndUpdate(riderId, {
        status: 'BUSY',
        currentDelivery: deliveryId
      })
    ]);

    return { success: true, route };
  } catch (error) {
    console.error('Error assigning rider:', error);
    throw error;
  }
}

// backend/services/delivery/tracking.js (continued)
export async function updateDeliveryStatus(deliveryId, status, metadata = {}) {
    try {
      const delivery = await Delivery.findByIdAndUpdate(
        deliveryId,
        {
          status,
          ...metadata,
          ...(status === 'DELIVERED' ? { actualDeliveryTime: new Date() } : {})
        },
        { new: true }
      ).populate('rider');
  
      if (!delivery) {
        throw new Error('Delivery not found');
      }
  
      // Update rider status if needed
      if (status === 'DELIVERED' || status === 'FAILED') {
        await Rider.findByIdAndUpdate(delivery.rider._id, {
          status: 'AVAILABLE',
          currentDelivery: null,
          $inc: { deliveriesCompleted: status === 'DELIVERED' ? 1 : 0 }
        });
      }
  
      // Emit WebSocket event
      global.wss?.clients.forEach(client => {
        if (client.deliveryId === deliveryId) {
          client.send(JSON.stringify({
            type: 'DELIVERY_STATUS',
            status,
            deliveryId
          }));
        }
      });
  
      return delivery;
    } catch (error) {
      console.error('Error updating delivery status:', error);
      throw error;
    }
  }
  