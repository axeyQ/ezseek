// database/services/qrOrderingService.js
import Order from '../../../database/models/Order';
import Table from '../../../database/models/Table';
import Customer from '../../../database/models/Customer';
import { generateQRCode } from '../utils/qrGenerator';

export const qrOrderingService = {
  async generateTableQR(tableId) {
    try {
      const table = await Table.findById(tableId);
      if (!table) {
        throw new Error('Table not found');
      }

      // Generate a unique ordering URL for this table
      const orderingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/order/table/${tableId}`;
      
      // Generate QR code
      const qrCode = await generateQRCode(orderingUrl);

      // Update table with QR code
      await Table.findByIdAndUpdate(tableId, {
        $set: {
          qrCode,
          qrLastGenerated: new Date()
        }
      });

      return {
        qrCode,
        orderingUrl
      };
    } catch (error) {
      console.error('Error generating table QR:', error);
      throw error;
    }
  },

  async createTableOrder(tableId, orderData) {
    try {
      // Verify table is available
      const table = await Table.findById(tableId);
      if (!table) {
        throw new Error('Table not found');
      }
      if (table.status !== 'available') {
        throw new Error('Table is not available');
      }

      // Create or update customer
      let customer = await Customer.findOne({
        contactNumber: orderData.customerPhone
      });

      if (!customer) {
        customer = await Customer.create({
          fullName: orderData.customerName,
          contactNumber: orderData.customerPhone
        });
      }

      // Create order
      const order = await Order.create({
        tableId,
        customerId: customer._id,
        items: orderData.items,
        specialInstructions: orderData.specialInstructions,
        orderType: 'dine-in',
        status: 'pending',
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone
      });

      // Update table status
      await Table.findByIdAndUpdate(tableId, {
        status: 'occupied',
        currentOrder: order._id
      });

      return order;
    } catch (error) {
      console.error('Error creating table order:', error);
      throw error;
    }
  },

  async updateTableOrder(orderId, updateData) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // If adding new items
      if (updateData.items) {
        order.items.push(...updateData.items);
      }

      // If updating special instructions
      if (updateData.specialInstructions) {
        order.specialInstructions = updateData.specialInstructions;
      }

      // If updating status
      if (updateData.status) {
        order.status = updateData.status;
      }

      await order.save();
      return order;
    } catch (error) {
      console.error('Error updating table order:', error);
      throw error;
    }
  },

  async getTableOrderStatus(tableId) {
    try {
      const order = await Order.findOne({
        tableId,
        status: { $nin: ['served', 'cancelled'] }
      }).populate('items.menuItem');

      return order;
    } catch (error) {
      console.error('Error getting table order status:', error);
      throw error;
    }
  }
};