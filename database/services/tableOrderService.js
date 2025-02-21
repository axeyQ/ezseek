// services/tableOrderService.js
import Order from '../models/Order';
import Table from '../models/Table';
import { realTimeService } from './redis/realTimeService';

class TableOrderService {
  async handleTableStatusChange(tableId, newStatus, orderData = null) {
    let session = null;
    try {
      session = await mongoose.startSession();
      session.startTransaction();

      // Update table status
      const table = await Table.findById(tableId).session(session);
      if (!table) {
        throw new Error('Table not found');
      }

      // Handle status change based on new status
      switch (newStatus) {
        case 'occupied':
          if (!orderData) {
            throw new Error('Order data required when occupying table');
          }
          // Create new order
          const order = await Order.create([{
            ...orderData,
            tableId: table._id,
            status: 'pending'
          }], { session });

          // Update table with order reference
          table.status = 'occupied';
          table.currentOrder = order[0]._id;
          await table.save({ session });

          // Notify relevant systems
          await realTimeService.updateTableStatus(tableId, {
            status: 'occupied',
            orderId: order[0]._id
          });
          await realTimeService.updateKDS(order[0]);
          break;

        case 'available':
          // Clear current order if exists
          if (table.currentOrder) {
            await Order.findByIdAndUpdate(
              table.currentOrder,
              { status: 'completed' },
              { session }
            );
          }
          table.status = 'available';
          table.currentOrder = null;
          await table.save({ session });
          break;

        case 'reserved':
          table.status = 'reserved';
          await table.save({ session });
          break;

        case 'maintenance':
          if (table.currentOrder) {
            throw new Error('Cannot set table to maintenance while order is active');
          }
          table.status = 'maintenance';
          await table.save({ session });
          break;

        default:
          throw new Error(`Invalid table status: ${newStatus}`);
      }

      await session.commitTransaction();
      return { success: true, table };

    } catch (error) {
      if (session) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      if (session) {
        session.endSession();
      }
    }
  }

  async getCurrentTableOrder(tableId) {
    const table = await Table.findById(tableId).populate('currentOrder');
    return table?.currentOrder || null;
  }

  async updateOrder(orderId, updateData) {
    const order = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    );

    if (!order) {
      throw new Error('Order not found');
    }

    // Notify KDS of order update
    await realTimeService.updateKDS(order);
    return order;
  }

  async getTableOrderHistory(tableId) {
    return Order.find({ tableId }).sort({ createdAt: -1 });
  }
}

export const tableOrderService = new TableOrderService();