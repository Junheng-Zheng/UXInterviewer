import { NextResponse } from 'next/server';
import { signIn, decodeToken } from '@/lib/cognito';
import { setSession } from '@/lib/session';

/**
 * Sign in route - authenticates user with Cognito
 */
export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Sign in with Cognito
    const result = await signIn(email, password);

    if (!result.success) {
      // Handle challenge (e.g., NEW_PASSWORD_REQUIRED)
      return NextResponse.json(
        {
          error: 'Challenge required',
          challengeName: result.challengeName,
          challengeParameters: result.challengeParameters,
          session: result.session,
        },
        { status: 200 }
      );
    }

    // Decode ID token to get user info
    const claims = decodeToken(result.idToken);
    const userInfo = {
      sub: claims.sub,
      email: claims.email,
      name: claims.name || claims.email,
      email_verified: claims.email_verified,
    };

    // Create session
    await setSession(userInfo);

    return NextResponse.json({
      success: true,
      user: userInfo,
    });
  } catch (error) {
    console.error('Sign in error:', error);
    
    // Handle specific Cognito errors
    let errorMessage = 'Failed to sign in';
    if (error.name === 'NotAuthorizedException') {
      errorMessage = 'Incorrect email or password';
    } else if (error.name === 'UserNotConfirmedException') {
      errorMessage = 'Please verify your email address';
    } else if (error.name === 'UserNotFoundException') {
      errorMessage = 'User not found';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 401 }
    );
  }
}

