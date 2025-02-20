import connectDB from '../../../../../database/connectDB';
import Order from '../../../../../database/models/Order';

export async function GET() {
  try {
    await connectDB();
    const orders = await Order.find().sort({ createdAt: -1 });
    return Response.json(orders);
  } catch (error) {
    console.error('GET Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const data = await request.json();
    
    const newOrder = await Order.create({
      item: {
        name: data.item.name,
        price: data.item.price,
        description: data.item.description
      },
      status: data.status
    });

    return Response.json(newOrder, { status: 201 });
  } catch (error) {
    console.error('POST Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Optional: Add DELETE and PUT routes if needed
export async function DELETE(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    const deletedOrder = await Order.findByIdAndDelete(id);
    if (!deletedOrder) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }
    
    return Response.json(deletedOrder);
  } catch (error) {
    console.error('DELETE Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const data = await request.json();
    
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        item: data.item,
        status: data.status
      },
      { new: true }
    );
    
    if (!updatedOrder) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }
    
    return Response.json(updatedOrder);
  } catch (error) {
    console.error('PUT Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}