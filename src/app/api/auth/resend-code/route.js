import { NextResponse } from 'next/server';
import { resendConfirmationCode } from '@/lib/cognito';

/**
 * Resend confirmation code route
 */
export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Resend confirmation code
    const result = await resendConfirmationCode(email);

    return NextResponse.json({
      success: true,
      message: 'Verification code resent successfully',
      codeDeliveryDetails: result.codeDeliveryDetails,
    });
  } catch (error) {
    console.error('Resend code error:', error);
    
    let errorMessage = 'Failed to resend verification code';
    if (error.name === 'UserNotFoundException') {
      errorMessage = 'User not found';
    } else if (error.name === 'InvalidParameterException') {
      errorMessage = 'Invalid email address';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}

