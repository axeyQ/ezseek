// app/api/customers/route.js
import connectDB from '../../../../../database/connectDB';
import Customer from '../../../../../database/models/Customer';

export async function GET() {
  try {
    await connectDB();
    const customers = await Customer.find().sort('-createdAt');
    return Response.json(customers);
  } catch (error) {
    console.error('GET Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const data = await request.json();
    const customer = await Customer.create(data);
    return Response.json(customer, { status: 201 });
  } catch (error) {
    console.error('POST Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// app/api/customers/[id]/route.js
export async function PUT(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const data = await request.json();

    const customer = await Customer.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!customer) {
      return Response.json({ error: 'Customer not found' }, { status: 404 });
    }

    return Response.json(customer);
  } catch (error) {
    console.error('PUT Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const customer = await Customer.findByIdAndDelete(id);
    if (!customer) {
      return Response.json({ error: 'Customer not found' }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('DELETE Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}