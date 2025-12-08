// /app/api/auth/route.ts (Updated Login Handler)

import { NextRequest, NextResponse } from 'next/server';
import { login } from '@/lib/db/users'; // Use the new login function

// === POST (Login/Authentication Handler) ===
// This handles the client request to /api/auth
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json(); // <-- Now expects password

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    // 1. Fetch user and check password hash
    const user = await login(email, password);

    if (!user) {
      // Return 401 Unauthorized for security/login failures
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // 2. Successful login
    return NextResponse.json(user);
  } catch (error) {
    console.error('API Error during login:', error);
    return NextResponse.json(
      { error: 'Internal Server Error.' },
      { status: 500 }
    );
  }
}
