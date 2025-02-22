// frontend/src/utils/deliveryHelpers.js
export function getDeliveryStatus(delivery) {
    const statusMap = {
      PENDING: {
        label: 'Pending',
        color: 'yellow',
        description: 'Waiting for rider assignment'
      },
      ASSIGNED: {
        label: 'Assigned',
        color: 'blue',
        description: 'Rider assigned and en route to pickup'
      },
      PICKED_UP: {
        label: 'Picked Up',
        color: 'purple',
        description: 'Order picked up by rider'
      },
      IN_TRANSIT: {
        label: 'In Transit',
        color: 'indigo',
        description: 'Order in transit to destination'
      },
      DELIVERED: {
        label: 'Delivered',
        color: 'green',
        description: 'Order successfully delivered'
      },
      FAILED: {
        label: 'Failed',
        color: 'red',
        description: 'Delivery failed to complete'
      }
    };
  
    return statusMap[delivery.status] || {
      label: delivery.status,
      color: 'gray',
      description: 'Status unknown'
    };
  }
  
  export function calculateOptimalRoute(pickupCoords, dropCoords) {
    return fetch('/api/route-optimization', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pickup: pickupCoords,
        drop: dropCoords
      })
    }).then(res => res.json());
  }
  