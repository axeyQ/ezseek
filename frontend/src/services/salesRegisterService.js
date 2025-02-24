// database/services/salesRegisterService.js
import Order from '../../../database/models/Order';
import Customer from '../../../database/models/Customer';
import Table from '../../../database/models/Table';
import Menu from '../../../database/models/Menu';
import { calculateTax } from '../utils/taxCalculator';
import mongoose from 'mongoose';

export const salesRegisterService = {
  // Create new sales register entry
  async createSale(saleData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const {
        customerId,
        items,
        paymentMethod,
        orderType,
        tableId,
        discountType,
        discountValue,
        specialInstructions
      } = saleData;

      // Validate items stock availability
      for (const item of items) {
        const menuItem = await Menu.findById(item.menuItem);
        if (!menuItem || !menuItem.isAvailable) {
          throw new Error(`Item ${menuItem?.name || 'Unknown'} is not available`);
        }
      }

      // Calculate bill components
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const taxes = await calculateTax(subtotal, orderType);
      
      // Calculate discount
      let discount = 0;
      if (discountType === 'percentage') {
        discount = (subtotal * discountValue) / 100;
      } else if (discountType === 'fixed') {
        discount = discountValue;
      }

      // Calculate final total
      const total = subtotal + taxes.totalTax - discount;

      // Create the sale
      const sale = await Order.create([{
        customerId,
        items,
        orderType,
        tableId,
        specialInstructions,
        status: 'pending',
        billDetails: {
          subtotal,
          taxes: taxes.taxDetails,
          totalTax: taxes.totalTax,
          discount,
          total,
          paymentMethod,
          paymentStatus: 'pending',
          billNumber: await this.generateBillNumber(),
          billDate: new Date()
        }
      }], { session });

      // Update table status if it's a dine-in order
      if (orderType === 'dine-in' && tableId) {
        await Table.findByIdAndUpdate(
          tableId,
          {
            status: 'occupied',
            currentOrder: sale[0]._id
          },
          { session }
        );
      }

      // Update customer statistics
      await Customer.findByIdAndUpdate(
        customerId,
        {
          $inc: {
            totalOrders: 1,
            totalOrdersValue: total,
            totalDiscountGiven: discount
          },
          $set: { lastOrderDate: new Date() }
        },
        { session }
      );

      await session.commitTransaction();
      return sale[0];
    } catch (error) {
      await session.abortTransaction();
      console.error('Error creating sale:', error);
      throw error;
    } finally {
      session.endSession();
    }
  },

  // Process payment for a sale
  async processPayment(orderId, paymentDetails) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { 
        method, 
        amount, 
        transactionId, 
        splitPayments,
        changeAmount 
      } = paymentDetails;

      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      if (order.billDetails.paymentStatus === 'paid') {
        throw new Error('Order is already paid');
      }

      // Validate payment amount
      const totalPaid = splitPayments ? 
        splitPayments.reduce((sum, payment) => sum + payment.amount, 0) : 
        amount;

      if (totalPaid < order.billDetails.total) {
        throw new Error('Payment amount is less than total bill');
      }

      // Update payment details
      const paymentRecord = {
        method,
        amount: totalPaid,
        transactionId,
        splitPayments,
        changeAmount,
        timestamp: new Date()
      };

      // Update order with payment details
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        {
          $set: {
            'billDetails.paymentStatus': 'paid',
            'billDetails.payment': paymentRecord
          }
        },
        { new: true, session }
      );

      // If it's a dine-in order, update table status
      if (updatedOrder.orderType === 'dine-in' && updatedOrder.tableId) {
        await Table.findByIdAndUpdate(
          updatedOrder.tableId,
          {
            status: 'available',
            currentOrder: null
          },
          { session }
        );
      }

      await session.commitTransaction();
      return updatedOrder;
    } catch (error) {
      await session.abortTransaction();
      console.error('Error processing payment:', error);
      throw error;
    } finally {
      session.endSession();
    }
  },

  // Generate unique bill number
  async generateBillNumber() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const lastBill = await Order.findOne({
        'billDetails.billDate': { $gte: today },
        'billDetails.billNumber': { $exists: true }
      })
      .sort({ 'billDetails.billNumber': -1 })
      .select('billDetails.billNumber');

      let billNumber;
      if (lastBill && lastBill.billDetails) {
        const lastNumber = parseInt(lastBill.billDetails.billNumber.split('-')[1]);
        billNumber = `BILL-${(lastNumber + 1).toString().padStart(4, '0')}`;
      } else {
        billNumber = 'BILL-0001';
      }

      return billNumber;
    } catch (error) {
      console.error('Error generating bill number:', error);
      throw error;
    }
  },

  // Get sales summary for a time period
  async getSalesSummary(startDate, endDate) {
    try {
      const summary = await Order.aggregate([
        {
          $match: {
            'billDetails.billDate': {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            },
            'billDetails.paymentStatus': 'paid'
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: "%Y-%m-%d", date: "$billDetails.billDate" } },
              paymentMethod: "$billDetails.payment.method"
            },
            totalSales: { $sum: "$billDetails.total" },
            totalOrders: { $sum: 1 },
            averageOrderValue: { $avg: "$billDetails.total" },
            totalTax: { $sum: "$billDetails.totalTax" },
            totalDiscount: { $sum: "$billDetails.discount" }
          }
        },
        {
          $sort: { "_id.date": 1 }
        }
      ]);

      return summary;
    } catch (error) {
      console.error('Error getting sales summary:', error);
      throw error;
    }
  },

  // Get pending orders
  async getPendingOrders() {
    try {
      return await Order.find({
        'billDetails.paymentStatus': 'pending',
        status: { $nin: ['cancelled'] }
      })
      .populate('customerId', 'fullName contactNumber')
      .populate('tableId')
      .sort('createdAt');
    } catch (error) {
      console.error('Error getting pending orders:', error);
      throw error;
    }
  },

  // Cancel order
  async cancelOrder(orderId, reason) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status === 'cancelled') {
        throw new Error('Order is already cancelled');
      }

      // Update order status
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        {
          $set: {
            status: 'cancelled',
            cancelReason: reason,
            cancelledAt: new Date()
          }
        },
        { new: true, session }
      );

      // If it's a dine-in order, update table status
      if (updatedOrder.orderType === 'dine-in' && updatedOrder.tableId) {
        await Table.findByIdAndUpdate(
          updatedOrder.tableId,
          {
            status: 'available',
            currentOrder: null
          },
          { session }
        );
      }

      await session.commitTransaction();
      return updatedOrder;
    } catch (error) {
      await session.abortTransaction();
      console.error('Error cancelling order:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }
};