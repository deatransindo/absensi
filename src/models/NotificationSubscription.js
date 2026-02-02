import mongoose from 'mongoose';

const notificationSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    endpoint: {
      type: String,
      required: true,
    },
    keys: {
      p256dh: {
        type: String,
        required: true,
      },
      auth: {
        type: String,
        required: true,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index untuk mencari subscription berdasarkan userId
notificationSubscriptionSchema.index({ userId: 1, isActive: 1 });

// Index unik untuk endpoint agar tidak ada duplikasi
notificationSubscriptionSchema.index({ endpoint: 1 }, { unique: true });

export default mongoose.models.NotificationSubscription ||
  mongoose.model('NotificationSubscription', notificationSubscriptionSchema);
