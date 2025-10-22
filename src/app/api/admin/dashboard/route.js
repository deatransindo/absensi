import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Absensi from '@/models/Absensi';
import User from '@/models/User';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = await getSessionUser(request);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAbsensi = await Absensi.find({
      tanggal: { $gte: today, $lt: tomorrow },
    }).populate('userId', 'name email');

    const allUsers = await User.find( // ⚠️ UBAH: dari allMarketing jadi allUsers
      { role: 'USER', isActive: true }, // ⚠️ UBAH: dari MARKETING jadi USER
      'name email'
    );

    const stats = {
      totalUsers: allUsers.length, // ⚠️ UBAH: dari totalMarketing jadi totalUsers
      checkedIn: todayAbsensi.filter((a) => a.checkInTime).length,
      checkedOut: todayAbsensi.filter((a) => a.checkOutTime).length,
      notCheckedIn:
        allUsers.length - todayAbsensi.filter((a) => a.checkInTime).length,
    };

    return NextResponse.json({
      stats,
      todayAbsensi,
      allUsers, // ⚠️ UBAH: dari allMarketing jadi allUsers
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}