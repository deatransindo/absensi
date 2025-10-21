import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Visit from '@/models/Visit';
import { getSessionUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || session.userId;

    const visits = await Visit.find({ userId })
      .sort({ visitTime: -1 })
      .limit(50);

    return NextResponse.json({ visits });
  } catch (error) {
    console.error('Get visits error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const {
      customerName,
      customerPhone,
      customerAddress,
      visitLat,
      visitLng,
      visitType,
      visitResult,
      notes,
      photos,
    } = await request.json();

    const visit = await Visit.create({
      userId: session.userId,
      customerName,
      customerPhone,
      customerAddress,
      visitLat,
      visitLng,
      visitType,
      visitResult,
      notes,
      photos: photos || [],
    });

    return NextResponse.json({
      message: 'Kunjungan berhasil dicatat',
      visit,
    });
  } catch (error) {
    console.error('Create visit error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}