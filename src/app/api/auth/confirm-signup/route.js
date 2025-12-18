import { NextResponse } from 'next/server';
import { confirmSignUp, signIn, decodeToken } from '@/lib/cognito';
import { setSession } from '@/lib/session';

/**
 * Confirm sign up route - verifies email with code and signs in user
 */
export async function POST(request) {
  try {
    const { email, username, code, password } = await request.json();

    if ((!email && !username) || !code) {
      return NextResponse.json(
        { error: 'Email/username and verification code are required' },
        { status: 400 }
      );
    }

    // Use username (UUID) if provided, otherwise use email
    // When email is an alias, we must use the actual username (UUID) for confirmation
    const usernameToUse = username || email;
    
    // Confirm sign up - use username (UUID) when email is alias
    await confirmSignUp(usernameToUse, code, !!username);

    // If password is provided, sign in the user automatically
    if (password) {
      const result = await signIn(email, password);
      
      if (result.success) {
        const claims = decodeToken(result.idToken);
        const userInfo = {
          sub: claims.sub,
          email: claims.email,
          name: claims.name || claims.email,
          email_verified: claims.email_verified,
        };

        await setSession(userInfo);

        return NextResponse.json({
          success: true,
          user: userInfo,
          message: 'Email verified and signed in successfully',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully. Please sign in.',
    });
  } catch (error) {
    console.error('Confirm sign up error:', error);
    
    let errorMessage = 'Failed to verify email';
    if (error.name === 'CodeMismatchException') {
      errorMessage = 'Invalid verification code';
    } else if (error.name === 'ExpiredCodeException') {
      errorMessage = 'Verification code has expired';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}

