// frontend/src/app/api/orders/route.js
import connectDB from '../../../../../database/connectDB';
import Order from '../../../../../database/models/Order';
import Menu from '../../../../../database/models/Menu';
import Table from '../../../../../database/models/Table';

// Import all models before using populate
import '../../../../../database/models/Menu';
import '../../../../../database/models/Table';

// Helper function to emit WebSocket event
const emitSocketEvent = async (event, data) => {
  try {
    const response = await fetch('http://localhost:3001/emit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event, data }),
    });
    if (!response.ok) {
      console.error('Failed to emit socket event');
    }
  } catch (error) {
    console.error('Error emitting socket event:', error);
  }
};


export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const tableId = searchParams.get('tableId');

    let query = {};
    if (status) query.status = status;
    if (tableId) query.tableId = tableId;

    const orders = await Order.find(query)
      .populate({
        path: 'tableId',
        model: Table
      })
      .populate({
        path: 'items.menuItem',
        model: Menu
      })
      .sort('-createdAt');

    return Response.json(orders);
  } catch (error) {
    console.error('GET Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const data = await request.json();

    // Validate table exists and is available
    const table = await Table.findById(data.tableId);
    if (!table) {
      return Response.json({ error: 'Table not found' }, { status: 404 });
    }
    if (table.status === 'occupied' && data.orderType === 'dine-in') {
      return Response.json({ error: 'Table is already occupied' }, { status: 400 });
    }

    // Validate menu items and get their prices
    const menuItems = await Menu.find({
      '_id': { $in: data.items.map(item => item.menuItem) }
    });

    if (menuItems.length !== data.items.length) {
      return Response.json({ error: 'Some menu items not found' }, { status: 400 });
    }

    // Create order items with verified prices
    const orderItems = data.items.map(item => {
      const menuItem = menuItems.find(mi => mi._id.toString() === item.menuItem.toString());
      return {
        menuItem: item.menuItem,
        quantity: item.quantity,
        price: menuItem.price,
        notes: item.notes
      };
    });

    // Calculate total amount
    const totalAmount = orderItems.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    // Create order with calculated total
    const order = await Order.create({
      ...data,
      items: orderItems,
      totalAmount: totalAmount // Add the calculated total amount
    });

    // Update table status if dine-in
    if (data.orderType === 'dine-in') {
      await Table.findByIdAndUpdate(data.tableId, { 
        status: 'occupied',
        currentOrder: order._id
      });
    }

    // Populate the response
    const populatedOrder = await Order.findById(order._id)
      .populate({
        path: 'tableId',
        model: Table
      })
      .populate({
        path: 'items.menuItem',
        model: Menu
      });
      // Emit new order event
    await emitSocketEvent('order:new', populatedOrder);
    return Response.json(populatedOrder, { status: 201 });
  } catch (error) {
    console.error('POST Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}


export async function PUT(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const data = await request.json();

    const order = await Order.findById(id);
    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    // Handle order completion
    if (data.status === 'served' && order.status !== 'served') {
      await Table.findByIdAndUpdate(order.tableId, {
        status: 'available',
        currentOrder: null
      });
    }

    // Handle order cancellation
    if (data.status === 'cancelled' && order.status !== 'cancelled') {
      await Table.findByIdAndUpdate(order.tableId, {
        status: 'available',
        currentOrder: null
      });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true }
    )
    .populate({
      path: 'tableId',
      model: Table
    })
    .populate({
      path: 'items.menuItem',
      model: Menu
    });
 // Emit order update event
    await emitSocketEvent('order:update', updatedOrder);
    return Response.json(updatedOrder);
  } catch (error) {
    console.error('PUT Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const order = await Order.findById(id);
    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    // Release table if order is being deleted
    if (order.orderType === 'dine-in') {
      await Table.findByIdAndUpdate(order.tableId, {
        status: 'available',
        currentOrder: null
      });
    }

    await Order.findByIdAndDelete(id);
    // Emit order delete event
    await emitSocketEvent('order:delete', id);
    return Response.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('DELETE Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}