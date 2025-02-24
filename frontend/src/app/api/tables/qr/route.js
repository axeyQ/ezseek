// frontend/src/app/api/tables/qr/route.js
import { NextResponse } from 'next/server';
import connectDB from '../../../../../../database/connectDB';
import Table from '../../../../../../database/models/Table';
import { tableQRService } from '../../../../services/tableQRService';

export async function POST(request) {
  try {
    await connectDB();
    const data = await request.json();
    const { tableId } = data;

    // Get table details
    const table = await Table.findById(tableId);
    if (!table) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      );
    }

    // Generate new QR code
    const qrData = await tableQRService.generateQRCode(table._id.toString(), table.tableNumber);

    // Update table with QR code data
    const updatedTable = await Table.findByIdAndUpdate(
      tableId,
      {
        qrCode: {
          url: qrData.orderingUrl,
          image: qrData.qrCode,
          generatedAt: qrData.generatedAt
        }
      },
      { new: true }
    );

    return NextResponse.json(updatedTable);
  } catch (error) {
    console.error('QR Generation Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const tableId = searchParams.get('tableId');

    // Get QR code for specific table
    if (tableId) {
      const table = await Table.findById(tableId);
      if (!table) {
        return NextResponse.json(
          { error: 'Table not found' },
          { status: 404 }
        );
      }

      // If QR code doesn't exist or needs regeneration
      if (!table.qrCode?.image) {
        const qrData = await tableQRService.generateQRCode(table._id.toString(), table.tableNumber);
        await Table.findByIdAndUpdate(tableId, {
          qrCode: {
            url: qrData.orderingUrl,
            image: qrData.qrCode,
            generatedAt: qrData.generatedAt
          }
        });
        return NextResponse.json(qrData);
      }

      return NextResponse.json(table.qrCode);
    }

    // Get all tables with QR codes
    const tables = await Table.find({ isActive: true });
    const tablesWithQR = await Promise.all(
      tables.map(async (table) => {
        if (!table.qrCode?.image) {
          const qrData = await tableQRService.generateQRCode(table._id.toString(), table.tableNumber);
          const updatedTable = await Table.findByIdAndUpdate(
            table._id,
            {
              qrCode: {
                url: qrData.orderingUrl,
                image: qrData.qrCode,
                generatedAt: qrData.generatedAt
              }
            },
            { new: true }
          );
          return updatedTable;
        }
        return table;
      })
    );

    return NextResponse.json(tablesWithQR);
  } catch (error) {
    console.error('QR Fetch Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch QR codes' },
      { status: 500 }
    );
  }
}