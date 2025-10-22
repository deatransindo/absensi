const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  phone: String,
  role: { type: String, enum: ['ADMIN', 'USER'], default: 'USER' }, // ⚠️ UBAH
  isActive: { type: Boolean, default: true },
}, { timestamps: true });