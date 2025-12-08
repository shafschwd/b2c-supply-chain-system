// /app/api/auth/signup/route.ts (New Registration Handler)

import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/db/users';
import { User } from '@/types/user';

// === POST (User Registration Handler) ===
// This handles the client request to /api/auth/signup
export async function POST(req: NextRequest) {
  try {
    const user: User = await req.json();

    // Basic validation
    if (!user.email || !user.password || !user.name) {
      return NextResponse.json(
        { error: 'Missing required fields.' },
        { status: 400 }
      );
    }

    // 1. Register user (hashes password and inserts into DB)
    const newUser = await registerUser(user);

    // 2. Success
    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    console.error('API Error during registration:', error);
    // Handle database unique constraint errors gracefully
    if (error.message.includes('already exists')) {
      return NextResponse.json(
        { error: 'User with this email already exists.' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Registration failed.' },
      { status: 500 }
    );
  }
}
