import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getSessionUser, hashPassword } from '@/lib/auth';

export async function PATCH(request, { params }) {
  try {
    const session = await getSessionUser(request);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { name, email, phone, password, isActive } = body;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (password) updateData.password = await hashPassword(password);

    const user = await User.findByIdAndUpdate(params.id, updateData, {
      new: true,
    }).select('-password');

    return NextResponse.json({
      message: 'User berhasil diupdate',
      user,
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getSessionUser(request);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    await User.findByIdAndDelete(params.id);

    return NextResponse.json({
      message: 'User berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}