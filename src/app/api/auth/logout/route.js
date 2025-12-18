import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/session';

/**
 * Logout route - clears session and redirects to home
 */
export async function GET(request) {
  try {
    // Delete session
    await deleteSession();

    // Redirect to home page
    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.error('Logout error:', error);
    // Even if logout fails, clear session and redirect home
    await deleteSession();
    return NextResponse.redirect(new URL('/', request.url));
  }
}

