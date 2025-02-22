// frontend/src/app/api/riders/[id]/route.js
import { NextResponse } from 'next/server';
import connectDB from '../../../../../../database/connectDB';
import Rider from '../../../../../../database/models/Rider';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const rider = await Rider.findById(params.id);
    if (!rider) {
      return NextResponse.json({ error: 'Rider not found' }, { status: 404 });
    }
    return NextResponse.json(rider);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch rider' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const data = await request.json();
    const rider = await Rider.findByIdAndUpdate(params.id, data, { new: true });
    if (!rider) {
      return NextResponse.json({ error: 'Rider not found' }, { status: 404 });
    }
    return NextResponse.json(rider);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update rider' }, { status: 500 });
  }
}