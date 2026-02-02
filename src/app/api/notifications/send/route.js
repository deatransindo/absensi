import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import NotificationSubscription from '@/models/NotificationSubscription';
import User from '@/models/User';
import Absensi from '@/models/Absensi';
import webpush from 'web-push';

// Konfigurasi VAPID keys
const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BBlOVNMUruZyQS-l6HRObsLgSGeuy_fkhGl0YOOQ46vq1eXYbYyGH_3I3WGVPbM_IM_iOw6urJ5NVH0WckTb3L4',
  privateKey: process.env.VAPID_PRIVATE_KEY || '4U8lp7FtLIsgtfO_5tDaENoICs3cmSk8XTdBO6eeWho',
};

webpush.setVapidDetails(
  'mailto:admin@absensi.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Helper function untuk mengirim notifikasi
async function sendNotification(subscription, payload) {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      },
      JSON.stringify(payload)
    );
    return { success: true };
  } catch (error) {
    console.error('Error sending notification:', error);

    // Jika subscription tidak valid atau expired, nonaktifkan
    if (error.statusCode === 410 || error.statusCode === 404) {
      await NotificationSubscription.findByIdAndUpdate(subscription._id, {
        isActive: false,
      });
    }

    return { success: false, error };
  }
}

export async function POST(request) {
  try {
    await connectDB();

    const { type } = await request.json();

    // Validasi type
    if (!['checkin', 'checkout'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid notification type. Use "checkin" or "checkout"' },
        { status: 400 }
      );
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Ambil semua user aktif dengan role USER
    const users = await User.find({ isActive: true, role: 'USER' });

    const results = {
      total: users.length,
      sent: 0,
      failed: 0,
      noSubscription: 0,
      details: [],
    };

    for (const user of users) {
      // Cek status absensi hari ini
      const attendance = await Absensi.findOne({
        userId: user._id,
        tanggal: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      });

      let shouldSend = false;
      let notificationPayload = {};

      if (type === 'checkin') {
        // Jika belum check-in sama sekali
        if (!attendance || !attendance.checkInTime) {
          shouldSend = true;
          notificationPayload = {
            title: '⏰ Pengingat Check-in',
            body: `Halo ${user.name}, jangan lupa untuk check-in hari ini!`,
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            data: {
              url: '/user',
              type: 'checkin',
            },
          };
        }
      } else if (type === 'checkout') {
        // Jika sudah check-in tapi belum check-out
        if (attendance && attendance.checkInTime && !attendance.checkOutTime) {
          shouldSend = true;
          notificationPayload = {
            title: '⏰ Pengingat Check-out',
            body: `Halo ${user.name}, jangan lupa untuk check-out sebelum pulang!`,
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            data: {
              url: '/user',
              type: 'checkout',
            },
          };
        }
      }

      if (shouldSend) {
        // Cari subscription aktif untuk user ini
        const subscriptions = await NotificationSubscription.find({
          userId: user._id,
          isActive: true,
        });

        if (subscriptions.length === 0) {
          results.noSubscription++;
          results.details.push({
            userId: user._id,
            name: user.name,
            status: 'no_subscription',
          });
          continue;
        }

        // Kirim ke semua subscription yang aktif
        let sentToUser = false;
        for (const subscription of subscriptions) {
          const result = await sendNotification(subscription, notificationPayload);
          if (result.success) {
            sentToUser = true;
          }
        }

        if (sentToUser) {
          results.sent++;
          results.details.push({
            userId: user._id,
            name: user.name,
            status: 'sent',
          });
        } else {
          results.failed++;
          results.details.push({
            userId: user._id,
            name: user.name,
            status: 'failed',
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Notifications sent successfully for ${type}`,
      results,
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
    return NextResponse.json(
      { error: 'Failed to send notifications', details: error.message },
      { status: 500 }
    );
  }
}

// Endpoint untuk mendapatkan public VAPID key
export async function GET() {
  return NextResponse.json({
    publicKey: vapidKeys.publicKey,
  });
}
