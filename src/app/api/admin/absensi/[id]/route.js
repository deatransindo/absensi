import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Absensi from '@/models/Absensi';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied. Admin only.' }, { status: 403 });
    }

    await connectDB();

    const { id } = params;
    const body = await request.json();
    const { checkInTime, checkOutTime, status } = body;

    const absensi = await Absensi.findById(id);
    if (!absensi) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    // Update fields
    if (checkInTime !== undefined) {
      absensi.checkInTime = checkInTime ? new Date(checkInTime) : null;
    }
    if (checkOutTime !== undefined) {
      absensi.checkOutTime = checkOutTime ? new Date(checkOutTime) : null;
    }
    if (status !== undefined) {
      absensi.status = status;
    }

    // Recalculate workDuration in minutes
    if (absensi.checkInTime && absensi.checkOutTime) {
      const diffMs = new Date(absensi.checkOutTime) - new Date(absensi.checkInTime);
      absensi.workDuration = Math.round(diffMs / 60000);
    } else {
      absensi.workDuration = null;
    }

    await absensi.save();

    const updated = await Absensi.findById(id).populate('userId', 'name email');

    return NextResponse.json({ success: true, absensi: updated });
  } catch (error) {
    console.error('Update absensi error:', error);
    return NextResponse.json({ error: 'Server error: ' + error.message }, { status: 500 });
  }
}
