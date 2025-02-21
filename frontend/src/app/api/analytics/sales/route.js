// app/api/analytics/sales/route.js
import connectDB from '../../../../../../database/connectDB';
import Order from '../../../../../../database/models/Order';
import Menu from '../../../../../../database/models/Menu';

export async function POST(request) {
  try {
    await connectDB();
    const { timeFrame, startDate, endDate } = await request.json();

    const dateFilter = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    // Get all orders within date range
    const orders = await Order.find(dateFilter)
      .populate('items.menuItem')
      .sort('createdAt');

    // Process revenue data
    const revenueData = processRevenueData(orders, timeFrame);

    // Get top selling items
    const topItems = await processTopItems(orders);

    // Process orders by time of day
    const ordersByTime = processOrdersByTime(orders);

    // Process category breakdown
    const categoryBreakdown = await processCategoryBreakdown(orders);

    return Response.json({
      revenue: revenueData,
      topItems,
      ordersByTime,
      categoryBreakdown
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function processRevenueData(orders, timeFrame) {
  const revenueMap = new Map();

  orders.forEach(order => {
    const date = getDateKey(order.createdAt, timeFrame);
    const current = revenueMap.get(date) || { date, revenue: 0, orders: 0 };
    
    current.revenue += order.totalAmount;
    current.orders += 1;
    revenueMap.set(date, current);
  });

  return Array.from(revenueMap.values());
}

async function processTopItems(orders) {
  const itemMap = new Map();

  orders.forEach(order => {
    order.items.forEach(item => {
      const current = itemMap.get(item.menuItem._id) || {
        name: item.menuItem.name,
        quantity: 0,
        revenue: 0
      };
      
      current.quantity += item.quantity;
      current.revenue += item.price * item.quantity;
      itemMap.set(item.menuItem._id, current);
    });
  });

  return Array.from(itemMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
}

function processOrdersByTime(orders) {
  const hourMap = new Map();

  orders.forEach(order => {
    const hour = new Date(order.createdAt).getHours();
    const current = hourMap.get(hour) || { hour, orders: 0 };
    current.orders += 1;
    hourMap.set(hour, current);
  });

  return Array.from(hourMap.values())
    .sort((a, b) => a.hour - b.hour);
}

async function processCategoryBreakdown(orders) {
  const categoryMap = new Map();

  orders.forEach(order => {
    order.items.forEach(item => {
      const category = item.menuItem.category;
      const current = categoryMap.get(category) || {
        name: category,
        value: 0
      };
      current.value += item.price * item.quantity;
      categoryMap.set(category, current);
    });
  });

  return Array.from(categoryMap.values());
}

function getDateKey(date, timeFrame) {
  const d = new Date(date);
  switch (timeFrame) {
    case 'daily':
      return d.toISOString().split('T')[0];
    case 'weekly':
      const week = getWeekNumber(d);
      return `Week ${week}`;
    case 'monthly':
      return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    default:
      return d.toISOString().split('T')[0];
  }
}

function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}