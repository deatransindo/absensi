import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Absensi from '@/models/Absensi';
import { getSessionUser } from '@/lib/auth';

export async function GET(request) {
  try {
    // Debug 1: Cek authorization header
    const authHeader = request.headers.get('authorization');
    console.log('🔐 Auth Header:', authHeader);

    if (!authHeader) {
      console.log('❌ No authorization header');
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    // Debug 2: Cek session
    const session = await getSessionUser(request);
    console.log('👤 Session:', session);

    if (!session) {
      console.log('❌ No session found');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (session.role !== 'ADMIN') {
      console.log('❌ Not admin role:', session.role);
      return NextResponse.json({ error: 'Access denied. Admin only.' }, { status: 403 });
    }

    console.log('✅ Auth passed, fetching data...');

    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    console.log('📊 Filters:', { userId, month, year });

    const query = {};

    if (userId) {
      query.userId = userId;
    }

    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      query.tanggal = { $gte: startDate, $lte: endDate };
    }

    const absensiData = await Absensi.find(query)
      .populate('userId', 'name email')
      .sort({ tanggal: -1 });

    console.log('✅ Found', absensiData.length, 'records');

    // Calculate statistics
    const stats = {
      totalDays: absensiData.length,
      hadir: absensiData.filter((a) => a.status === 'HADIR').length,
      izin: absensiData.filter((a) => a.status === 'IZIN').length,
      sakit: absensiData.filter((a) => a.status === 'SAKIT').length,
      alpha: absensiData.filter((a) => a.status === 'ALPHA').length,
      avgWorkDuration:
        absensiData.reduce((sum, a) => sum + (a.workDuration || 0), 0) /
        (absensiData.filter((a) => a.workDuration).length || 1),
      lateCheckins: absensiData.filter((a) => {
        if (!a.checkInTime) return false;
        const hour = new Date(a.checkInTime).getHours();
        const minute = new Date(a.checkInTime).getMinutes();
        return hour > 8 || (hour === 8 && minute > 15);
      }).length,
    };

    return NextResponse.json({
      absensi: absensiData,
      stats,
    });
  } catch (error) {
    console.error('❌ Reports error:', error);
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    );
  }
}