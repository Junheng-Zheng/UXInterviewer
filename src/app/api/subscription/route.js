import { NextResponse } from 'next/server';
import { getUserSubscription } from '@/lib/subscription';

export async function GET() {
  try {
    const subscription = await getUserSubscription();
    return NextResponse.json(subscription);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { plan: 'free', status: 'inactive', interviewsUsed: 0 },
      { status: 500 }
    );
  }
}
