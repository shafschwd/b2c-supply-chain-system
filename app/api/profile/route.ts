// /app/api/profile/route.ts (NEW FILE)

import { NextRequest, NextResponse } from 'next/server';
import { updateUser } from '@/lib/db/users';
import { User } from '@/types/user';

// === PUT (Update User Profile) ===
export async function PUT(req: NextRequest) {
  try {
    const { userId, updates } = await req.json();

    if (!userId || !updates) {
      return NextResponse.json(
        { error: 'Missing user ID or update data.' },
        { status: 400 }
      );
    }

    const updatedUser = await updateUser({ id: userId, ...updates });

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Return the updated user object to refresh the frontend state
    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error('API Error saving profile:', error);
    return NextResponse.json(
      { error: 'Internal Server Error saving profile.' },
      { status: 500 }
    );
  }
}
