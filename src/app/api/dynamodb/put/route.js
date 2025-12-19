import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getAWSCredentialsWithRefresh } from '@/lib/auth-helper';
import { putItem } from '@/lib/dynamodb';

/**
 * Put an item in DynamoDB
 */
export async function POST(request) {
  try {
    // Get user session and AWS credentials (with automatic token refresh)
    const { credentials, session } = await getAWSCredentialsWithRefresh();

    // Get item from request body
    const item = await request.json();

    if (!item) {
      return NextResponse.json(
        { error: 'Item is required' },
        { status: 400 }
      );
    }

    // Ensure userId is set (for row-level access control)
    if (!item.userId) {
      item.userId = session.sub;
    }

    // Put item in DynamoDB
    await putItem(credentials, item);

    return NextResponse.json({
      success: true,
      message: 'Item saved successfully',
    });
  } catch (error) {
    console.error('Error putting item:', error);
    
    // Handle token expiration - redirect to login
    // Note: Client-side code will handle storing the return URL (the actual page URL, not the API endpoint)
    if (error.code === 'TOKEN_EXPIRED' || error.requiresAuth || error.message?.includes('Token expired')) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          requiresAuth: true,
          redirectTo: '/Signin'
        },
        { status: 401 }
      );
    }
    
    let errorMessage = 'Failed to save item';
    if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

