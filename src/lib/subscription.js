import { getSession } from '@/lib/session'
import { AdminGetUserCommand, AdminUpdateUserAttributesCommand } from '@aws-sdk/client-cognito-identity-provider';
import { cognitoClient } from '@/lib/cognito';

export async function getUserSubscription() {
    const session = await getSession();
    if (!session || !session.email) {
        return { plan: 'free', period: 'monthly', status: 'inactive', updated: null, interviewsUsed: 0 };
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
        
        // Parse interviewsUsed as number, default to 0 if not set
        const interviewsUsedStr = attributes['custom:InterviewsUsed'];
        const interviewsUsed = interviewsUsedStr ? parseInt(interviewsUsedStr, 10) || 0 : 0;
        
        return {
            plan: attributes['custom:subscription_plan'] || 'free',
            period: attributes['custom:subscription_period'] || 'monthly',
            status: attributes['custom:subscription_status'] || 'inactive',
            updated: attributes['custom:subscription_updated'],
            interviewsUsed: interviewsUsed,
        };
    } catch (error) {
        console.error('Error getting user subscription:', error);
        return { plan: 'free', status: 'inactive', interviewsUsed: 0 };
    }
}

/**
 * Check if user can start a new interview based on their plan and interviews used
 * @param {string} plan - User's subscription plan ('free', 'pro', 'pro_yearly')
 * @param {number} interviewsUsed - Number of interviews the user has used
 * @returns {boolean} - True if user can start interview, false otherwise
 */
export function canStartInterview(plan, interviewsUsed) {
    // Paid plans can always start interviews
    if (plan !== 'free') {
        return true;
    }
    
    // Free plan users can only start if they've used less than 3 interviews
    return interviewsUsed < 3;
}

/**
 * Increment the InterviewsUsed count for a user in Cognito
 * @param {string} email - User email
 * @returns {Promise<number>} - The new interviewsUsed count
 */
export async function incrementInterviewsUsed(email) {
    const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
    
    if (!USER_POOL_ID) {
        throw new Error('COGNITO_USER_POOL_ID environment variable is not set');
    }

    if (!email) {
        throw new Error('Email is required to increment interviews used');
    }

    try {
        // First, get the current value
        const getCommand = new AdminGetUserCommand({
            UserPoolId: USER_POOL_ID,
            Username: email,
        });

        const user = await cognitoClient.send(getCommand);

        // Extract current interviewsUsed value
        const attributes = {};
        user.UserAttributes?.forEach(attr => {
            attributes[attr.Name] = attr.Value;
        });

        const currentCountStr = attributes['custom:InterviewsUsed'];
        const currentCount = currentCountStr ? parseInt(currentCountStr, 10) || 0 : 0;
        const newCount = currentCount + 1;

        // Update the attribute with the new count
        const updateCommand = new AdminUpdateUserAttributesCommand({
            UserPoolId: USER_POOL_ID,
            Username: email,
            UserAttributes: [
                {
                    Name: 'custom:InterviewsUsed',
                    Value: newCount.toString(),
                },
            ],
        });

        await cognitoClient.send(updateCommand);

        return newCount;
    } catch (error) {
        console.error('Error incrementing interviews used:', error);
        throw error;
    }
}