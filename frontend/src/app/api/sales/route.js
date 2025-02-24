// frontend/src/app/api/sales/route.js
import connectDB from '../../../../../database/connectDB';
import Order from '../../../../../database/models/Order';
import Table from '../../../../../database/models/Table';
import Customer from '../../../../../database/models/Customer';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
      await connectDB();
      const data = await request.json();
  
      switch (data.action) {
        case 'generate-bill': {
          // Get customer details
          const customer = await Customer.findById(data.orderData.customerId);
          if (!customer) {
            return NextResponse.json(
              { error: 'Customer not found' },
              { status: 404 }
            );
          }
  
          // Create order with customer details
          const orderData = {
            customerId: data.orderData.customerId,
            customerName: customer.fullName,
            customerPhone: customer.phone,
            items: data.orderData.items.map(item => ({
              menuItem: item.menuItem,
              quantity: item.quantity,
              price: item.price,
              name: item.name
            })),
            orderType: data.orderData.orderType,
            tableId: data.orderData.tableId,
            specialInstructions: data.orderData.specialInstructions,
            status: 'pending',
            totalAmount: data.orderData.totalAmount,
            discountType: data.orderData.discountType || 'none',
            discountValue: data.orderData.discountValue || 0
          };
  
          const order = await Order.create(orderData);
  
          // If it's a dine-in order, update table status
          if (data.orderData.orderType === 'dine-in' && data.orderData.tableId) {
            await Table.findByIdAndUpdate(data.orderData.tableId, {
              status: 'occupied',
              currentOrder: order._id
            });
          }
  
          // Populate the order with related data
          const populatedOrder = await Order.findById(order._id)
            .populate('customerId')
            .populate('tableId');
  
          return NextResponse.json(populatedOrder);
        }
  
        case 'process-payment': {
          const { orderId, paymentDetails } = data;
  
          const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            {
              $set: {
                status: 'completed',
                'billDetails.paymentStatus': 'paid',
                'billDetails.payment': {
                  method: paymentDetails.method,
                  amount: paymentDetails.amount,
                  timestamp: new Date()
                }
              }
            },
            { new: true }
          ).populate('customerId').populate('tableId');
  
          if (!updatedOrder) {
            return NextResponse.json(
              { error: 'Order not found' },
              { status: 404 }
            );
          }
  
          // Free up table if it was a dine-in order
          if (updatedOrder.orderType === 'dine-in' && updatedOrder.tableId) {
            await Table.findByIdAndUpdate(updatedOrder.tableId, {
              status: 'available',
              currentOrder: null
            });
          }
  
          return NextResponse.json(updatedOrder);
        }
  
        default:
          return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
          );
      }
    } catch (error) {
      console.error('Sales API Error:', error);
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  }
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    
    const orders = await Order.find({
      status: { $in: ['pending', 'preparing', 'ready'] }
    })
    .populate('customerId')
    .populate('tableId')
    .sort('-createdAt');

    return NextResponse.json(orders);
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}