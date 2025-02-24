// src/app/api/orders/[orderId]/route.js
import { NextResponse } from 'next/server';
import connectDB from '../../../../../../database/connectDB';
import Order from '../../../../../../database/models/Order';
import Table from '../../../../../../database/models/Table';

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { orderId } = params;
    const data = await request.json();

    // Validate status
    if (!['pending', 'preparing', 'ready', 'served', 'cancelled'].includes(data.status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update order status
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status: data.status },
      { new: true }
    ).populate('tableId');

    // Update table status if order is served or cancelled
    if ((data.status === 'served' || data.status === 'cancelled') && updatedOrder.tableId) {
      await Table.findByIdAndUpdate(updatedOrder.tableId._id, {
        status: 'available',
        currentOrder: null
      });
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update order status' },
      { status: 500 }
    );
  }
}