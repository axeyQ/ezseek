// app/api/customers/search/route.js
import connectDB from '../../../../../../database/connectDB';
import Customer from '../../../../../../database/models/Customer';

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    const customers = await Customer.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
    .select('name phone email addresses')
    .limit(10);

    return Response.json(customers);
  } catch (error) {
    console.error('Search Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}