import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { cognitoClient } from '@/lib/cognito';

/**
 * Get current user profile from Cognito
 */
export async function GET() {
  try {
    const session = await getSession();
    
    if (!session || !session.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
    
    if (!USER_POOL_ID) {
      return NextResponse.json({ error: 'User pool not configured' }, { status: 500 });
    }

    const command = new AdminGetUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: session.email,
    });
    
    const user = await cognitoClient.send(command);
    
    // Extract user attributes
    const attributes = {};
    user.UserAttributes?.forEach(attr => {
      attributes[attr.Name] = attr.Value;
    });
    
    return NextResponse.json({
      email: attributes.email || session.email,
      givenName: attributes.given_name || attributes.name?.split(' ')[0] || '',
      familyName: attributes.family_name || attributes.name?.split(' ').slice(1).join(' ') || '',
      name: attributes.name || '',
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
}
