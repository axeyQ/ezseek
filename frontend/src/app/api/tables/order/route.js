// app/api/tables/order/route.js
import { tableOrderService } from '../../../../../database/services/tableOrderService';

export async function POST(request) {
  try {
    const { tableId, order } = await request.json();
    
    const result = await tableOrderService.handleTableStatusChange(tableId, 'occupied', {
      items: order.items,
      notes: order.notes
    });

    return Response.json(result, { status: 201 });
  } catch (error) {
    console.error('POST Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { tableId, status } = await request.json();
    
    const result = await tableOrderService.handleTableStatusChange(tableId, status);
    return Response.json(result);
  } catch (error) {
    console.error('PUT Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}