// frontend/src/app/api/riders/route.js
import { NextResponse } from 'next/server';
import connectDB from '../../../../../database/connectDB';
import Rider from '../../../../../database/models/Rider';

export async function GET() {
  try {
    await connectDB();
    const riders = await Rider.find().select('name email phoneNumber status deliveriesCompleted currentLocation').sort({ deliveriesCompleted: -1 });
    return NextResponse.json(riders);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch riders' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const data = await request.json();
    const rider = await Rider.create(data);
    return NextResponse.json(rider, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create rider' }, { status: 500 });
  }
}