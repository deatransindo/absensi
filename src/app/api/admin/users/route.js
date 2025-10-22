import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Absensi from '@/models/Absensi';
import Visit from '@/models/Visit';
import { getSessionUser, hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';


export async function GET(request) {
  try {
    const session = await getSessionUser(request);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const users = await User.find({ role: 'MARKETING' }).select(
      '-password'
    ).sort({ name: 1 });

    // Get counts for each user
    const usersWithCounts = await Promise.all(
      users.map(async (user) => {
        const absensiCount = await Absensi.countDocuments({ userId: user._id });
        const visitCount = await Visit.countDocuments({ userId: user._id });
        
        return {
          ...user.toObject(),
          _count: {
            absensi: absensiCount,
            visits: visitCount,
          },
        };
      })
    );

    return NextResponse.json({ users: usersWithCounts });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getSessionUser(request);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { name, email, phone, password } = await request.json();

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: 'MARKETING',
    });

    return NextResponse.json({
      message: 'User berhasil ditambahkan',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Add user error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}