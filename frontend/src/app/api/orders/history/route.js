// frontend/src/app/api/orders/history/route.js
import { NextResponse } from 'next/server';
import connectDB from '../../../../../../database/connectDB';
import Order from '../../../../../../database/models/Order';
import Table from '../../../../../../database/models/Table';
import Customer from '../../../../../../database/models/Customer';

// Make sure the models are registered before using them
import '../../../../../../database/models/Menu';
import '../../../../../../database/models/Table';
import '../../../../../../database/models/Customer';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const orderType = searchParams.get('orderType');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build query
    let query = {};

    // Date range
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + 'T23:59:59.999Z')
      };
    }

    // Order type
    if (orderType && orderType !== 'all') {
      query.orderType = orderType;
    }

    // Status
    if (status && status !== 'all') {
      query.status = status;
    }

    // Search
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with proper population
    const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .populate({
      path: 'items.menuItem',
      model: 'Menu',
      select: 'name price'
    })
    .populate('tableId')
    .populate('customerId');
  
  // Transform the orders to include all necessary data
  const transformedOrders = orders.map(order => {
    const plainOrder = order.toObject();
    return {
      ...plainOrder,
      items: plainOrder.items.map(item => ({
        quantity: item.quantity,
        name: item.menuItem?.name || item.name,
        price: item.price
      }))
    };
  });

    return NextResponse.json(transformedOrders);
  } catch (error) {
    console.error('Error fetching order history:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch order history' },
      { status: 500 }
    );
  }
}