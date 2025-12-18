import { NextResponse } from 'next/server';
import { signUp } from '@/lib/cognito';

/**
 * Sign up route - creates a new user in Cognito
 */
export async function POST(request) {
  try {
    const { name, email, password, confirmPassword } = await request.json();

    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { error: 'Name, email, password, and confirm password are required' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Sign up with Cognito
    const result = await signUp(email, password, {
      email: email,
      name: name,
    });

    return NextResponse.json({
      success: true,
      message: 'User created successfully. Please check your email for verification code.',
      userSub: result.userSub,
      username: result.username, // Return username (UUID) for confirmation
      codeDeliveryDetails: result.codeDeliveryDetails,
    });
  } catch (error) {
    console.error('Sign up error:', error);
    
    // Handle specific Cognito errors
    let errorMessage = 'Failed to create account';
    if (error.name === 'UsernameExistsException') {
      errorMessage = 'An account with this email already exists';
    } else if (error.name === 'InvalidPasswordException') {
      errorMessage = 'Password does not meet requirements';
    } else if (error.name === 'InvalidParameterException') {
      errorMessage = 'Invalid email or password format';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}

