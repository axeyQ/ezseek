// frontend/src/app/api/orders/route.js
import connectDB from '../../../../../database/connectDB';
import Order from '../../../../../database/models/Order';
import Menu from '../../../../../database/models/Menu';
import Table from '../../../../../database/models/Table';
import Customer from '../../../../../database/models/Customer';

// Import all models before using populate
import '../../../../../database/models/Menu';
import '../../../../../database/models/Table';
import { NextResponse } from 'next/server';

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


export async function POST(request) {
  try {
    await connectDB();
    const data = await request.json();

    // Validate required fields
    if (!data.customerName || !data.customerPhone) {
      return NextResponse.json(
        { error: 'Customer name and phone are required' },
        { status: 400 }
      );
    }

    // Find or create customer
    let customer = await Customer.findOne({ phone: data.customerPhone });
    
    if (!customer) {
      // Create new customer
      customer = await Customer.create({
        fullName: data.customerName,
        phone: data.customerPhone
      });
    }

    // Create order with customer details
    const orderData = {
      customerId: customer._id,
      customerName: customer.fullName,
      customerPhone: customer.phone,
      tableId: data.tableId,
      items: data.items.map(item => ({
        menuItem: item.menuItem,
        quantity: item.quantity,
        price: item.price,
        name: item.name
      })),
      orderType: data.orderType,
      specialInstructions: data.specialInstructions,
      status: 'pending',
      totalAmount: data.totalAmount
    };

    const order = await Order.create(orderData);

    // Update table status if it's a dine-in order
    if (data.orderType === 'dine-in' && data.tableId) {
      await Table.findByIdAndUpdate(data.tableId, {
        status: 'occupied',
        currentOrder: order._id
      });
    }

    // Update customer statistics
    await Customer.findByIdAndUpdate(customer._id, {
      $inc: {
        totalOrders: 1,
        totalOrdersValue: data.totalAmount
      },
      $set: { lastOrderDate: new Date() }
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Order Creation Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    let query = {};
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('customerId')
      .populate('tableId')
      .sort('-createdAt');

    return NextResponse.json(orders);
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    );
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
 websocketService.emit('order:update', updatedOrder);
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
    websocketService.emit('order:delete', id);
    return Response.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('DELETE Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}