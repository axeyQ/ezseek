// database/services/reportingService.js
import Order from '../../../database/models/Order';
import Menu from '../../../database/models/Menu';
import Customer from '../../../database/models/Customer';

export const reportingService = {
  // All Sales Record
  async getSalesReport(startDate, endDate) {
    try {
      const sales = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
            status: { $nin: ['cancelled'] }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              orderType: "$orderType"
            },
            totalSales: { $sum: "$totalAmount" },
            totalOrders: { $count: {} },
            averageOrderValue: { $avg: "$totalAmount" }
          }
        },
        {
          $sort: { "_id.date": 1 }
        }
      ]);

      return sales;
    } catch (error) {
      console.error('Error generating sales report:', error);
      throw error;
    }
  },

  // Item Wise Sales Record
  async getItemWiseSalesReport(startDate, endDate) {
    try {
      const itemSales = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
            status: { $nin: ['cancelled'] }
          }
        },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.menuItem",
            totalQuantity: { $sum: "$items.quantity" },
            totalRevenue: { 
              $sum: { $multiply: ["$items.quantity", "$items.price"] }
            }
          }
        },
        {
          $lookup: {
            from: "menus",
            localField: "_id",
            foreignField: "_id",
            as: "menuItem"
          }
        },
        { $unwind: "$menuItem" },
        {
          $project: {
            itemName: "$menuItem.name",
            category: "$menuItem.category",
            totalQuantity: 1,
            totalRevenue: 1,
            averagePrice: { $divide: ["$totalRevenue", "$totalQuantity"] }
          }
        },
        { $sort: { totalRevenue: -1 } }
      ]);

      return itemSales;
    } catch (error) {
      console.error('Error generating item-wise sales report:', error);
      throw error;
    }
  },

  // Kitchen Order Ticket Record
  async getKOTReport(startDate, endDate) {
    try {
      const kotReport = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
          }
        },
        {
          $group: {
            _id: "$status",
            totalOrders: { $count: {} },
            averagePreparationTime: {
              $avg: {
                $divide: [
                  { $subtract: ["$updatedAt", "$createdAt"] },
                  1000 * 60 // Convert to minutes
                ]
              }
            }
          }
        },
        { $sort: { totalOrders: -1 } }
      ]);

      return kotReport;
    } catch (error) {
      console.error('Error generating KOT report:', error);
      throw error;
    }
  },

  // Customer Analysis Report
  async getCustomerAnalysisReport() {
    try {
      const customerAnalysis = await Customer.aggregate([
        {
          $group: {
            _id: null,
            totalCustomers: { $count: {} },
            averageOrderValue: { $avg: "$averageOrderValue" },
            totalRevenue: { $sum: "$totalOrdersValue" },
            averageOrdersPerCustomer: { $avg: "$totalOrders" }
          }
        }
      ]);

      const topCustomers = await Customer.find()
        .sort('-totalOrdersValue')
        .limit(10)
        .select('fullName contactNumber totalOrders totalOrdersValue averageOrderValue');

      return {
        analysis: customerAnalysis[0],
        topCustomers
      };
    } catch (error) {
      console.error('Error generating customer analysis report:', error);
      throw error;
    }
  }
};