// src/app/api/seed/route.js
import { NextResponse } from 'next/server';
import connectDB from '../../../../../database/connectDB';
import Delivery from '../../../../../database/models/Delivery';
import Rider from '../../../../../database/models/Rider';

export async function GET() {
    try {
      await connectDB();
  
      // Clear existing data
      await Promise.all([
        Rider.deleteMany({}),
        Delivery.deleteMany({})
      ]);
  
      // Create sample riders
      const riders = await Rider.create([
        {
          name: 'John Doe',
          email: 'john.doe@example.com',
          phoneNumber: '+1234567890',
          status: 'AVAILABLE',
          deliveriesCompleted: 25,
          currentLocation: {
            type: 'Point',
            coordinates: [77.6164847688898, 12.934698932103944] // [longitude, latitude]
          }
        },
        {
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          phoneNumber: '+1234567891',
          status: 'AVAILABLE',
          deliveriesCompleted: 15,
          currentLocation: {
            type: 'Point',
            coordinates: [77.6264847688898, 12.944698932103944]
          }
        }
      ]);
  
      // Create sample deliveries
      const deliveries = await Delivery.create([
        {
          trackingId: 'DEL001',
          status: 'PENDING',
          pickupLocation: {
            type: 'Point',
            coordinates: [77.6164847688898, 12.934698932103944],
            address: 'ABC Restaurant, MG Road'
          },
          dropLocation: {
            type: 'Point',
            coordinates: [77.6364847688898, 12.954698932103944],
            address: '123 Main St, Indiranagar'
          },
          estimatedTime: 30
        },
        {
          trackingId: 'DEL002',
          status: 'IN_TRANSIT',
          rider: riders[0]._id,
          pickupLocation: {
            type: 'Point',
            coordinates: [77.6264847688898, 12.944698932103944],
            address: 'XYZ Restaurant, Koramangala'
          },
          dropLocation: {
            type: 'Point',
            coordinates: [77.6464847688898, 12.964698932103944],
            address: '456 Park Ave, HSR Layout'
          },
          estimatedTime: 45
        }
      ]);
  
      return NextResponse.json({
        message: 'Sample data created successfully',
        riders,
        deliveries
      });
    } catch (error) {
      console.error('Failed to seed data:', error);
      return NextResponse.json(
        { 
          error: 'Failed to seed data',
          details: error.message 
        },
        { status: 500 }
      );
    }
  }