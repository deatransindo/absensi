import mongoose from 'mongoose';

const AbsensiSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tanggal: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['HADIR', 'IZIN', 'SAKIT', 'ALPHA'],
    default: 'HADIR',
  },
  checkInTime: Date,
  checkInLat: Number,
  checkInLng: Number,
  checkInAddress: String,
  checkInPhoto: String,
  
  checkOutTime: Date,
  checkOutLat: Number,
  checkOutLng: Number,
  checkOutAddress: String,
  checkOutPhoto: String,
  
  notes: String,
  dailyReport: String,
  workDuration: Number, // in minutes
}, {
  timestamps: true,
});

AbsensiSchema.index({ userId: 1, tanggal: 1 });

export default mongoose.models.Absensi || mongoose.model('Absensi', AbsensiSchema);