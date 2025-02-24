// frontend/src/app/api/customers/route.js
import connectDB from '../../../../../database/connectDB';
import Customer from '../../../../../database/models/Customer';
import { NextResponse } from 'next/server';
export async function GET(request) {
    try {
      await connectDB();
      const { searchParams } = new URL(request.url);
      const searchPhone = searchParams.get('phone');
      
      if (searchPhone) {
        const cleanPhone = searchPhone.replace(/\D/g, '');
        const customer = await Customer.findOne({
          $or: [
            { phone: cleanPhone },
            { alternatePhone: cleanPhone }
          ]
        });
        return NextResponse.json(customer || null);
      }
      
      const customers = await Customer.find()
        .sort('-lastOrderDate')
        .limit(100);
      return NextResponse.json(customers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      return NextResponse.json({
        error: 'Failed to fetch customers'
      }, { status: 500 });
    }
  }

  export async function POST(request) {
    try {
      await connectDB();
      const data = await request.json();
  
      // Validate required fields
      if (!data.fullName || !data.phone) {
        return NextResponse.json({
          error: 'Full name and phone number are required'
        }, { status: 400 });
      }
  
      // Clean phone numbers
      const phone = data.phone.replace(/\D/g, '');
      const alternatePhone = data.alternatePhone ? data.alternatePhone.replace(/\D/g, '') : undefined;
  
      // Check for duplicate phone number
      const existingCustomer = await Customer.findOne({ 
        $or: [
          { phone },
          { alternatePhone: phone }
        ]
      });
  
      if (existingCustomer) {
        return NextResponse.json({
          error: 'A customer with this phone number already exists'
        }, { status: 400 });
      }
  
      // Create customer
      const customerData = {
        ...data,
        phone,
        alternatePhone
      };
  
      const customer = await Customer.create(customerData);
      return NextResponse.json(customer, { status: 201 });
  
    } catch (error) {
      console.error('Customer creation error:', error);
  
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return NextResponse.json({ error: errors.join(', ') }, { status: 400 });
      }
  
      if (error.code === 11000) {
        return NextResponse.json({
          error: 'A customer with this phone number already exists'
        }, { status: 400 });
      }
  
      return NextResponse.json({
        error: 'Failed to save customer'
      }, { status: 500 });
    }
  }
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

// Additional endpoint for customer ledger
export async function PATCH(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const data = await request.json();
    
    const customer = await Customer.findById(id);
    if (!customer) {
      return Response.json({ error: 'Customer not found' }, { status: 404 });
    }
    
    // Update advance payment or due amount
    if (data.advancePayment) {
      customer.advancePayment += data.advancePayment;
    }
    if (data.dueAmount) {
      customer.dueAmount += data.dueAmount;
    }
    
    await customer.save();
    return Response.json(customer);
  } catch (error) {
    console.error('PATCH Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}