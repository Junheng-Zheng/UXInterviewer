import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getAWSCredentials } from '@/lib/identity-pool';

/**
 * Get AWS credentials for the authenticated user
 * This route exchanges the user's ID token for temporary AWS credentials
 */
export async function GET() {
  try {
    // Get user session
    const session = await getSession();

    if (!session || !session.idToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get AWS credentials using ID token
    const credentials = await getAWSCredentials(session.idToken);

    return NextResponse.json({
      success: true,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken,
        expiration: credentials.expiration,
        identityId: credentials.identityId,
      },
    });
  } catch (error) {
    console.error('Error getting AWS credentials:', error);
    
    let errorMessage = 'Failed to get AWS credentials';
    if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

