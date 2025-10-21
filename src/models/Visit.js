import mongoose from 'mongoose';

const VisitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  customerName: {
    type: String,
    required: true,
  },
  customerPhone: String,
  customerAddress: {
    type: String,
    required: true,
  },
  visitTime: {
    type: Date,
    default: Date.now,
  },
  visitLat: {
    type: Number,
    required: true,
  },
  visitLng: {
    type: Number,
    required: true,
  },
  visitType: {
    type: String,
    required: true,
  },
  visitResult: {
    type: String,
    required: true,
  },
  notes: String,
  photos: [String],
}, {
  timestamps: true,
});

VisitSchema.index({ userId: 1, visitTime: -1 });

export default mongoose.models.Visit || mongoose.model('Visit', VisitSchema);