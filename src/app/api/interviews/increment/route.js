import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { incrementInterviewsUsed } from '@/lib/subscription';

export async function POST() {
  try {
    const session = await getSession();
    
    if (!session || !session.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const newCount = await incrementInterviewsUsed(session);

    return NextResponse.json({
      success: true,
      interviewsUsed: newCount
    });
  } catch (error) {
    console.error('Error incrementing interviews used:', error);
    return NextResponse.json(
      { 
        error: 'Failed to increment interview count',
        message: error.message || 'An error occurred'
      },
      { status: 500 }
    );
  }
}
