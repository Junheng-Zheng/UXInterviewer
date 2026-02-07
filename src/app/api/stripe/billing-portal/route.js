import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { getSession } from '@/lib/session';
import { getCognitoUsername } from '@/lib/cognito-username';
import { cognitoClient } from '@/lib/cognito';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;

/**
 * Create a Stripe Billing Portal session for the authenticated user.
 * Returns the portal URL so the client can redirect.
 */
export async function POST(request) {
  try {
    const session = await getSession();

    if (!session || (!session.email && !session.sub)) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    let stripeCustomerId = null;
    const cognitoUsername = getCognitoUsername(session);
    if (USER_POOL_ID && cognitoUsername) {
      try {
        const getCommand = new AdminGetUserCommand({
          UserPoolId: USER_POOL_ID,
          Username: cognitoUsername,
        });
        const user = await cognitoClient.send(getCommand);
        const attrs = {};
        user.UserAttributes?.forEach((attr) => {
          attrs[attr.Name] = attr.Value;
        });
        stripeCustomerId = attrs['custom:stripe_customer_id']?.trim() || null;
      } catch (err) {
        console.warn('Could not load Cognito user for stripe_customer_id:', err.message);
      }
    }

    let customer = null;
    if (stripeCustomerId) {
      try {
        const retrieved = await stripe.customers.retrieve(stripeCustomerId);
        if (retrieved && !retrieved.deleted) {
          customer = retrieved;
        }
      } catch (err) {
        console.warn('Stripe customer retrieve failed, falling back to email:', err.message);
      }
    }

    if (!customer && session.email) {
      const customers = await stripe.customers.list({
        email: session.email,
        limit: 1,
      });
      if (customers.data.length > 0) {
        customer = customers.data[0];
      }
    }

    if (!customer) {
      return NextResponse.json(
        { error: 'No billing account found. Subscribe to a plan first.' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (request.nextUrl && request.nextUrl.origin) || 'http://localhost:3000';
    const returnUrl = `${baseUrl}/Settings`;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating Stripe billing portal session:', error);
    return NextResponse.json(
      {
        error: 'Failed to open billing portal',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
