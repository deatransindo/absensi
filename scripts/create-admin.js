const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');

// Import model
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  phone: String,
  role: { type: String, enum: ['ADMIN', 'MARKETING'], default: 'MARKETING' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdmin() {
  try {
    // Get MongoDB URI from environment or prompt
    const MONGODB_URI = process.env.MONGODB_URI || await question('MongoDB URI: ');

    console.log('\n🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get admin details
    const email = await question('Email admin: ');
    const password = await question('Password admin: ');
    const name = await question('Nama admin: ');
    const phone = await question('Nomor HP (optional): ');

    // Check if admin already exists
    const existing = await User.findOne({ email });
    if (existing) {
      console.log('\n❌ User dengan email ini sudah ada!');
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const admin = await User.create({
      email,
      password: hashedPassword,
      name,
      phone: phone || undefined,
      role: 'ADMIN',
      isActive: true,
    });

    console.log('\n✅ Admin berhasil dibuat!');
    console.log('Email:', admin.email);
    console.log('Nama:', admin.name);
    console.log('Role:', admin.role);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    rl.close();
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdmin();