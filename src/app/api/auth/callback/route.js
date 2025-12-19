import { NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/oidc';
import { setSession } from '@/lib/session';
import { cookies } from 'next/headers';
import { getAndClearReturnUrl } from '@/lib/auth-redirect';

/**
 * Callback route - handles OIDC redirect from Cognito
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for errors from Cognito
    if (error) {
      console.error('Cognito error:', error);
      return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/?error=missing_params', request.url));
    }

    // Verify state
    const cookieStore = await cookies();
    const storedState = cookieStore.get('oauth_state')?.value;
    const storedNonce = cookieStore.get('oauth_nonce')?.value;

    if (!storedState || state !== storedState) {
      return NextResponse.redirect(new URL('/?error=invalid_state', request.url));
    }

    // Exchange code for tokens
    const tokenSet = await exchangeCodeForTokens(code, storedNonce, state);

    // Get user info from ID token
    const claims = tokenSet.claims();
    const userInfo = {
      sub: claims.sub,
      email: claims.email,
      name: claims.name || claims.email,
      email_verified: claims.email_verified,
      idToken: tokenSet.id_token, // Store ID token for getting AWS credentials
      refreshToken: tokenSet.refresh_token, // Store refresh token for token renewal
    };

    // Create session
    await setSession(userInfo);

    // Clean up OAuth cookies
    cookieStore.delete('oauth_state');
    cookieStore.delete('oauth_nonce');

    // Get return URL if user was redirected here due to token expiration
    const returnUrl = await getAndClearReturnUrl();
    const redirectUrl = returnUrl || '/';

    // Redirect to return URL or home page
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(new URL('/?error=callback_failed', request.url));
  }
}

