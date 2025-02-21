// app/api/customers/route.js
import connectDB from '../../../../../../database/connectDB';
import Customer from '../../../../../../database/models/Customer';

// app/api/customers/[id]/route.js
export async function GET(request, { params }) {
    try {
      await connectDB();
      const customer = await Customer.findById(params.id);
      if (!customer) {
        return Response.json({ error: 'Customer not found' }, { status: 404 });
      }
      return Response.json(customer);
    } catch (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
  }
  
  export async function PUT(request, { params }) {
    try {
      await connectDB();
      const data = await request.json();
      const customer = await Customer.findByIdAndUpdate(
        params.id,
        { ...data, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
      if (!customer) {
        return Response.json({ error: 'Customer not found' }, { status: 404 });
      }
      return Response.json(customer);
    } catch (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
  }
  
  export async function DELETE(request, { params }) {
    try {
      await connectDB();
      const customer = await Customer.findByIdAndDelete(params.id);
      if (!customer) {
        return Response.json({ error: 'Customer not found' }, { status: 404 });
      }
      return Response.json({ success: true });
    } catch (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
  }