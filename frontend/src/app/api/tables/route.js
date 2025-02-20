import connectDB from '../../../../../database/connectDB';
import Table from '../../../../../database/models/Table';

export async function GET() {
  try {
    await connectDB();
    const tables = await Table.find({ isActive: true })
      .sort('tableNumber')
      .populate('currentOrder');
    return Response.json(tables);
  } catch (error) {
    console.error('GET Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const data = await request.json();
    
    const newTable = await Table.create({
      tableNumber: data.tableNumber,
      capacity: data.capacity,
      status: data.status,
      location: data.location
    });

    return Response.json(newTable, { status: 201 });
  } catch (error) {
    console.error('POST Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const data = await request.json();
    
    const updatedTable = await Table.findByIdAndUpdate(
      id,
      data,
      { new: true }
    );
    
    if (!updatedTable) {
      return Response.json({ error: 'Table not found' }, { status: 404 });
    }
    
    return Response.json(updatedTable);
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
    
    const table = await Table.findById(id);
    if (!table) {
      return Response.json({ error: 'Table not found' }, { status: 404 });
    }
    
    // Soft delete by setting isActive to false
    table.isActive = false;
    await table.save();
    
    return Response.json(table);
  } catch (error) {
    console.error('DELETE Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}