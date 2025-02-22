// frontend/src/app/api/delivery/route.js
import { NextResponse } from 'next/server';
import connectDB from '../../../../../database/connectDB';
import Delivery from '../../../../../database/models/Delivery';
import { calculateOptimalRoute } from '@/services/olaMapService';

export async function GET(request) {
    try {
      console.log('Connecting to database...');
      await connectDB();
      
      console.log('Fetching deliveries...');
      const deliveries = await Delivery.find()
        .populate({
          path: 'rider',
          select: 'name email phoneNumber status'
        })
        .sort({ createdAt: -1 });
  
      console.log('Deliveries fetched:', deliveries.length);
      return NextResponse.json(deliveries);
    } catch (error) {
      console.error('Error in delivery API:', error);
      return NextResponse.json(
        { 
          error: 'Failed to fetch deliveries',
          details: error.message 
        },
        { status: 500 }
      );
    }
  }
  
  export async function POST(request) {
    try {
      await connectDB();
      const data = await request.json();
      
      // Ensure required GeoJSON fields
      const delivery = await Delivery.create({
        ...data,
        pickupLocation: {
          ...data.pickupLocation,
          type: 'Point'
        },
        dropLocation: {
          ...data.dropLocation,
          type: 'Point'
        }
      });
  
      return NextResponse.json(delivery, { status: 201 });
    } catch (error) {
      console.error('Error creating delivery:', error);
      return NextResponse.json(
        { 
          error: 'Failed to create delivery',
          details: error.message 
        },
        { status: 500 }
      );
    }
  }