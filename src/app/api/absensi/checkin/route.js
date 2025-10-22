import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Absensi from '@/models/Absensi';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';


export async function POST(request) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { lat, lng, address, photo } = await request.json();

    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existing = await Absensi.findOne({
      userId: session.userId,
      tanggal: { $gte: today, $lt: tomorrow },
    });

    if (existing && existing.checkInTime) {
      return NextResponse.json(
        { error: 'Anda sudah check-in hari ini' },
        { status: 400 }
      );
    }

    let absensi;
    if (existing) {
      existing.checkInTime = new Date();
      existing.checkInLat = lat;
      existing.checkInLng = lng;
      existing.checkInAddress = address;
      existing.checkInPhoto = photo;
      absensi = await existing.save();
    } else {
      absensi = await Absensi.create({
        userId: session.userId,
        tanggal: new Date(),
        status: 'HADIR',
        checkInTime: new Date(),
        checkInLat: lat,
        checkInLng: lng,
        checkInAddress: address,
        checkInPhoto: photo,
      });
    }

    return NextResponse.json({
      message: 'Check-in berhasil',
      absensi,
    });
  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}