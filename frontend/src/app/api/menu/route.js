// app/api/menu/route.js
import connectDB from '../../../../../database/connectDB';
import Menu from '../../../../../database/models/Menu';

export async function GET() {
  try {
    await connectDB();
    const menuItems = await Menu.find().sort('category');
    return Response.json(menuItems);
  } catch (error) {
    console.error('GET Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const data = await request.json();
    
    const newMenuItem = await Menu.create(data);
    return Response.json(newMenuItem, { status: 201 });
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
    
    const updatedMenuItem = await Menu.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!updatedMenuItem) {
      return Response.json({ error: 'Menu item not found' }, { status: 404 });
    }
    
    return Response.json(updatedMenuItem);
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
    
    const deletedMenuItem = await Menu.findByIdAndDelete(id);
    if (!deletedMenuItem) {
      return Response.json({ error: 'Menu item not found' }, { status: 404 });
    }
    
    return Response.json(deletedMenuItem);
  } catch (error) {
    console.error('DELETE Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}