import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// Import dengan destructuring
import { comparePassword, generateToken } from '@/lib/auth';

export async function POST(request) {
  console.log('🔐 Login API called');
  
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password harus diisi' },
        { status: 400 }
      );
    }

    console.log('🔌 Connecting to MongoDB...');
    await connectDB();

    console.log('🔍 Looking for user:', email);
    const user = await User.findOne({ email });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      );
    }

    console.log('🔑 Comparing password...');
    const isValid = await comparePassword(password, user.password);
    
    console.log('Password valid:', isValid);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      );
    }

    console.log('🎫 Generating token...');
    const token = generateToken(user._id.toString(), user.role);

    console.log('✅ Login successful');
    return NextResponse.json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server: ' + error.message },
      { status: 500 }
    );
  }
}