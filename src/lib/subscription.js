import { getSession } from '@/lib/session'
import { AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { cognitoClient } from '@/lib/cognito';

export async function getUserSubscription() {
    const session = await getSession();
    if (!session || !session.email) {
        return { plan: 'free', period: 'monthly', status: 'inactive', updated: null };
    }

    try {
        const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
        const command = new AdminGetUserCommand({
            UserPoolId: USER_POOL_ID,
            Username: session.email,
        });

        const user = await cognitoClient.send(command);

        const attributes = {};
        user.UserAttributes?.forEach(attr => {
            attributes[attr.Name] = attr.Value;
        });
        
        return {
            plan: attributes['custom:subscription_plan'] || 'free',
            period: attributes['custom:subscription_period'] || 'monthly',
            status: attributes['custom:subscription_status'] || 'inactive',
            updated: attributes['custom:subscription_updated'],
        };
    } catch (error) {
        console.error('Error getting user subscription:', error);
        return { plan: 'free', status: 'inactive' };
    }
}