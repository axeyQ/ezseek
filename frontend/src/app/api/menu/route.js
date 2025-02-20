import connectDB from '../../../../../database/connectDB';
import Menu from '../../../../../database/models/Menu';

export async function GET() {
  try {
    await connectDB();
    const menuItems = await Menu.find({ isAvailable: true }).sort('category');
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
    
    const newMenuItem = await Menu.create({
      name: data.name,
      description: data.description,
      price: data.price,
      category: data.category,
      isAvailable: data.isAvailable ?? true
    });

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
      {
        name: data.name,
        description: data.description,
        price: data.price,
        category: data.category,
        isAvailable: data.isAvailable
      },
      { new: true }
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