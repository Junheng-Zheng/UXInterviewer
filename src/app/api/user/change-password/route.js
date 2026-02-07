import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { changePassword } from '@/lib/cognito';
import { getAccessTokenWithRefresh } from '@/lib/auth-helper';

const PASSWORD_POLICY = {
  minLength: 8,
  hasUpper: /[A-Z]/,
  hasLower: /[a-z]/,
  hasNumber: /[0-9]/,
  hasSpecial: /[!@#$%^&*(),.?":{}|<>]/,
};

function validateNewPassword(password) {
  if (!password || password.length < PASSWORD_POLICY.minLength) {
    return 'Password must be at least 8 characters';
  }
  if (!PASSWORD_POLICY.hasUpper.test(password)) return 'Password must include one uppercase letter';
  if (!PASSWORD_POLICY.hasLower.test(password)) return 'Password must include one lowercase letter';
  if (!PASSWORD_POLICY.hasNumber.test(password)) return 'Password must include one number';
  if (!PASSWORD_POLICY.hasSpecial.test(password)) return 'Password must include one special character';
  return null;
}

/**
 * Change authenticated user's password.
 */
export async function POST(request) {
  try {
    const session = await getSession();

    if (!session || (!session.sub && !session.email)) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let body = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

    if (!currentPassword.trim()) {
      return NextResponse.json({ error: 'Current password is required' }, { status: 400 });
    }
    if (!newPassword.trim()) {
      return NextResponse.json({ error: 'New password is required' }, { status: 400 });
    }

    const policyError = validateNewPassword(newPassword);
    if (policyError) {
      return NextResponse.json({ error: policyError }, { status: 400 });
    }

    const { accessToken } = await getAccessTokenWithRefresh();

    try {
      await changePassword(accessToken, currentPassword.trim(), newPassword);
    } catch (err) {
      if (err.name === 'NotAuthorizedException') {
        return NextResponse.json(
          { error: err.message || 'Current password is incorrect' },
          { status: 401 }
        );
      }
      if (err.name === 'InvalidPasswordException') {
        return NextResponse.json(
          { error: err.message || 'New password does not meet requirements' },
          { status: 400 }
        );
      }
      console.error('Change password error:', err);
      return NextResponse.json(
        { error: err.message || 'Failed to change password' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Change password route error:', error);
    if (error.message === 'Not authenticated') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: error.message || 'Failed to change password' },
      { status: 500 }
    );
  }
}
