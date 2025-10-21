import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Absensi from '@/models/Absensi';
import { getSessionUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { lat, lng, address, photo, dailyReport } = await request.json();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const absensi = await Absensi.findOne({
      userId: session.userId,
      tanggal: { $gte: today, $lt: tomorrow },
    });

    if (!absensi || !absensi.checkInTime) {
      return NextResponse.json(
        { error: 'Anda belum check-in hari ini' },
        { status: 400 }
      );
    }

    if (absensi.checkOutTime) {
      return NextResponse.json(
        { error: 'Anda sudah check-out hari ini' },
        { status: 400 }
      );
    }

    // Calculate work duration
    const checkOutTime = new Date();
    const duration = Math.floor(
      (checkOutTime - absensi.checkInTime) / 60000
    );

    absensi.checkOutTime = checkOutTime;
    absensi.checkOutLat = lat;
    absensi.checkOutLng = lng;
    absensi.checkOutAddress = address;
    absensi.checkOutPhoto = photo;
    absensi.dailyReport = dailyReport;
    absensi.workDuration = duration;

    await absensi.save();

    return NextResponse.json({
      message: 'Check-out berhasil',
      absensi,
    });
  } catch (error) {
    console.error('Check-out error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}