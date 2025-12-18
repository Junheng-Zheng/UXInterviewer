import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getAWSCredentials } from '@/lib/identity-pool';
import { putItem } from '@/lib/dynamodb';

/**
 * Put an item in DynamoDB
 */
export async function POST(request) {
  try {
    // Get user session
    const session = await getSession();

    if (!session || !session.idToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get AWS credentials
    const credentials = await getAWSCredentials(session.idToken);

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

