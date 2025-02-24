// src/app/api/tables/find/route.js
import { NextResponse } from 'next/server';
import connectDB from '../../../../../database/connectDB';
import Table from '../../../../../database/models/Table';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const tableNumber = searchParams.get('number');
    
    if (!tableNumber) {
      return NextResponse.json(
        { error: 'Table number is required' },
        { status: 400 }
      );
    }

    // Find table by number
    const table = await Table.findOne({ 
      tableNumber: parseInt(tableNumber),
      isActive: true
    });

    if (!table) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(table);
  } catch (error) {
    console.error('Error finding table:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to find table' },
      { status: 500 }
    );
  }
}