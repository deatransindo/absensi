import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import NotificationSubscription from '@/models/NotificationSubscription';
import { getSessionUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { subscription } = await request.json();

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    await connectDB();

    // Hapus subscription lama untuk user ini jika ada
    await NotificationSubscription.updateMany(
      { userId: user.userId },
      { isActive: false }
    );

    // Simpan subscription baru atau update jika endpoint sudah ada
    const notificationSubscription = await NotificationSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        userId: user.userId,
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
        isActive: true,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Subscription saved successfully',
      data: notificationSubscription,
    });
  } catch (error) {
    console.error('Error saving notification subscription:', error);
    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { endpoint } = await request.json();

    await connectDB();

    // Nonaktifkan subscription
    await NotificationSubscription.findOneAndUpdate(
      { endpoint, userId: user.userId },
      { isActive: false }
    );

    return NextResponse.json({
      success: true,
      message: 'Subscription removed successfully',
    });
  } catch (error) {
    console.error('Error removing notification subscription:', error);
    return NextResponse.json(
      { error: 'Failed to remove subscription' },
      { status: 500 }
    );
  }
}
