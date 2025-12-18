import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getAWSCredentials } from '@/lib/identity-pool';
import { getItem } from '@/lib/dynamodb';

/**
 * Get an item from DynamoDB
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

    // Get key from request body
    const { key } = await request.json();

    if (!key) {
      return NextResponse.json(
        { error: 'Key is required' },
        { status: 400 }
      );
    }

    // Get item from DynamoDB
    const item = await getItem(credentials, key);

    // Optional: Verify user owns this item (if userId is in the item)
    if (item && item.userId && item.userId !== session.sub) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      item: item,
    });
  } catch (error) {
    console.error('Error getting item:', error);
    
    let errorMessage = 'Failed to get item';
    if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

