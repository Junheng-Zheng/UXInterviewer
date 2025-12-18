import { NextResponse } from 'next/server';
import { getAuthorizationUrl } from '@/lib/oidc';
import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';

/**
 * Login route - redirects to Cognito authorization endpoint
 */
export async function GET() {
  try {
    // Generate state and nonce for security
    const state = randomBytes(32).toString('hex');
    const nonce = randomBytes(32).toString('hex');

    // Store state and nonce in cookies for verification in callback
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

    // Get authorization URL from Cognito
    const authUrl = await getAuthorizationUrl(state, nonce);

    // Redirect to Cognito login
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      cognitoDomain: process.env.COGNITO_DOMAIN ? 'Set' : 'Missing',
      clientId: process.env.COGNITO_CLIENT_ID ? 'Set' : 'Missing',
    });
    return NextResponse.json(
      { 
        error: 'Failed to initiate login',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

