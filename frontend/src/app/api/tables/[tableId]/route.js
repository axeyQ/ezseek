// src/app/api/tables/[tableId]/route.js
import { NextResponse } from 'next/server';
import connectDB from '../../../../../../database/connectDB';
import Table from '../../../../../../database/models/Table';

export async function GET(request, { params }) {
    try {
      await connectDB();
      const { tableId } = params;
  
      // Validate tableId
      if (!tableId || tableId === 'undefined') {
        return NextResponse.json(
          { error: 'Invalid table ID' },
          { status: 400 }
        );
      }
  
      const table = await Table.findById(tableId).lean();
      
      if (!table) {
        return NextResponse.json(
          { error: 'Table not found' },
          { status: 404 }
        );
      }
  
      return NextResponse.json(table);
    } catch (error) {
      console.error('Error fetching table:', error);
      return NextResponse.json(
        { error: 'Failed to fetch table details' },
        { status: 500 }
      );
    }
  }