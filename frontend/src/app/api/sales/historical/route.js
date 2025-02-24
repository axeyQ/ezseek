// src/app/api/sales/historical/route.js
import { NextResponse } from 'next/server';
import connectDB from '../../../../../../database/connectDB';
import Order from '../../../../../../database/models/Order';

export async function GET() {
  try {
    await connectDB();
    const sales = await Order.find({})
      .sort({ date: -1 })
      .limit(365); // Last year of data

    return NextResponse.json(sales);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch sales data' },
      { status: 500 }
    );
  }
}