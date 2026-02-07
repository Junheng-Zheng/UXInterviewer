import { NextResponse } from 'next/server';
import { getUserSubscription, canStartInterview } from '@/lib/subscription';

export async function POST() {
  try {
    const subscription = await getUserSubscription();
    
    if (!subscription) {
      return NextResponse.json(
        { 
          canStart: false, 
          reason: 'Unable to verify subscription. Please try again.',
          interviewsUsed: 0,
          plan: 'free'
        },
        { status: 500 }
      );
    }

    const { plan, interviewsUsed } = subscription;
    const canStart = canStartInterview(plan || 'free', interviewsUsed || 0);

    if (!canStart) {
      return NextResponse.json({
        canStart: false,
        reason: 'You have reached your limit of 3 interviews. Upgrade to Pro for unlimited interviews.',
        interviewsUsed: interviewsUsed || 0,
        plan: plan || 'free'
      });
    }

    return NextResponse.json({
      canStart: true,
      interviewsUsed: interviewsUsed || 0,
      plan: plan || 'free'
    });
  } catch (error) {
    console.error('Error validating interview start:', error);
    return NextResponse.json(
      { 
        canStart: false, 
        reason: 'An error occurred while validating. Please try again.',
        interviewsUsed: 0,
        plan: 'free'
      },
      { status: 500 }
    );
  }
}
