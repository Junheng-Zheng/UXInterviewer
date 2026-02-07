import { NextResponse } from 'next/server';
import { getGoogleAuthorizationUrl } from '@/lib/oidc';
import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { setReturnUrl } from '@/lib/auth-redirect';

/**
 * Login route for Sign in with Google - redirects to Cognito with identity_provider=Google
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const returnUrl = searchParams.get('returnUrl');

    if (returnUrl) {
      await setReturnUrl(returnUrl);
    }

    const state = randomBytes(32).toString('hex');
    const nonce = randomBytes(32).toString('hex');

    const cookieStore = await cookies();
    cookieStore.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });

    cookieStore.set('oauth_nonce', nonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });

    const authUrl = getGoogleAuthorizationUrl(state, nonce);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Google login error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      cognitoDomain: process.env.COGNITO_DOMAIN ? 'Set' : 'Missing',
      clientId: process.env.COGNITO_CLIENT_ID ? 'Set' : 'Missing',
    });
    return NextResponse.json(
      {
        error: 'Failed to initiate Google login',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
