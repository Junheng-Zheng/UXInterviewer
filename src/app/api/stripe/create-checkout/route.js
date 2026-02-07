import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { getSession } from '@/lib/session';
import { getCognitoUsername } from '@/lib/cognito-username';
import { cognitoClient } from '@/lib/cognito';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;

/**
 * Create a Stripe Checkout Session. Uses stored Stripe customer ID when present;
 * otherwise creates by email. Always sends cognito_username in metadata for webhooks.
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

    const cognitoUsername = getCognitoUsername(session);
    if (!cognitoUsername) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    let stripeCustomerId = null;
    if (USER_POOL_ID) {
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

    const body = await request.json();
    const { priceId, successUrl, cancelUrl, metadata = {} } = body;

    if (!priceId) {
      return NextResponse.json(
        { error: 'priceId is required' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
      (request.headers.get('origin') || 'http://localhost:3000');
    const defaultSuccessUrl = `${baseUrl}/plans?success=true`;
    const defaultCancelUrl = `${baseUrl}/plans?canceled=true`;

    const sessionParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || defaultSuccessUrl,
      cancel_url: cancelUrl || defaultCancelUrl,
      metadata: {
        username: session.email || '',
        cognito_username: cognitoUsername,
        ...metadata,
      },
      client_reference_id: session.email || cognitoUsername,
    };

    if (stripeCustomerId) {
      sessionParams.customer = stripeCustomerId;
    } else {
      sessionParams.customer_email = session.email;
    }

    const checkoutSession = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);

    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
