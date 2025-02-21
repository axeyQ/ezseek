// app/api/customers/[id]/orders/route.js
import connectDB from '../../../../../../../database/connectDB';
import Order from '../../../../../../../database/models/Order';
import Customer from '../../../../../../../database/models/Customer';

export async function GET(request) {
  try {
    await connectDB();
    
    // Get customer ID from path
    const customerId = request.url.split('/')[4];
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    // Build query
    const query = {
      customerId,
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    if (status && status !== 'all') {
      query.status = status;
    }

    // Fetch orders
    const orders = await Order.find(query)
      .populate('items.menuItem')
      .sort('-createdAt');

    // Update customer stats if needed
    if (orders.length > 0) {
      const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
      const lastOrderDate = orders[0].createdAt;

      await Customer.findByIdAndUpdate(customerId, {
        $set: {
          totalOrders: orders.length,
          totalSpent,
          lastOrderDate
        }
      });
    }

    return Response.json(orders);
  } catch (error) {
    console.error('GET Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}