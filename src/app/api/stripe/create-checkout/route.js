import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSession } from '@/lib/session';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Create a Stripe Checkout Session with username (email) injected
 */
export async function POST(request) {
  try {
    // Get authenticated user session
    const session = await getSession();
    
    if (!session || !session.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { priceId, successUrl, cancelUrl, metadata = {} } = body;

    if (!priceId) {
      return NextResponse.json(
        { error: 'priceId is required' },
        { status: 400 }
      );
    }

    // Get the base URL for success/cancel URLs if not provided
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    (request.headers.get('origin') || 'http://localhost:3000');
    
    const defaultSuccessUrl = `${baseUrl}/plans?success=true`;
    const defaultCancelUrl = `${baseUrl}/plans?canceled=true`;

    // Create checkout session with username (email) in metadata
    const checkoutSession = await stripe.checkout.sessions.create({
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
      customer_email: session.email,
      metadata: {
        username: session.email,
        ...metadata,
      },
      client_reference_id: session.email, // Also store in client_reference_id for easy lookup
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
