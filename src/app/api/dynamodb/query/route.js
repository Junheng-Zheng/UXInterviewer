import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getAWSCredentialsWithRefresh } from '@/lib/auth-helper';
import { queryItems } from '@/lib/dynamodb';

/**
 * Query items from DynamoDB
 */
export async function POST(request) {
  try {
    // Get user session and AWS credentials (with automatic token refresh)
    const { credentials, session } = await getAWSCredentialsWithRefresh();

    // Get query parameters from request body
    const { partitionKey, partitionValue, options = {} } = await request.json();

    if (!partitionKey || partitionValue === undefined) {
      return NextResponse.json(
        { error: 'Partition key and value are required' },
        { status: 400 }
      );
    }

    // Query items from DynamoDB
    const items = await queryItems(credentials, partitionKey, partitionValue, options);

    // Optional: Filter items by userId for row-level access control
    // This ensures users only see their own data
    const filteredItems = items.filter(item => {
      // If item has userId, only return if it matches the session user
      if (item.userId) {
        return item.userId === session.sub;
      }
      // If no userId field, return all (might want to add userId to all items)
      return true;
    });

    return NextResponse.json({
      success: true,
      items: filteredItems,
      count: filteredItems.length,
    });
  } catch (error) {
    console.error('Error querying items:', error);
    
    let errorMessage = 'Failed to query items';
    if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

