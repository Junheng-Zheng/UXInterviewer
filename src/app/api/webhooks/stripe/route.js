import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { updateUserSubscription } from '@/lib/cognito';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle successful payment
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Get customer email from Stripe session
    const customerEmail = session.customer_email || session.customer_details?.email;
    
    if (!customerEmail) {
      console.error('No customer email found in session');
      return NextResponse.json({ error: 'No customer email' }, { status: 400 });
    }

    // Determine plan type from metadata, client_reference_id, or amount
    let planType = 'pro'; // default
    let planPeriod = 'monthly'; // default
    
    // Check session metadata for plan details
    if (session.metadata?.plan) {
      planType = session.metadata.plan;
    }
    if (session.metadata?.period) {
      planPeriod = session.metadata.period;
    }
    
    // Try to determine from amount_total (yearly is typically 11*12 = 132, monthly is 13)
    // This is a fallback if metadata isn't available
    if (!session.metadata?.period && session.amount_total) {
      const amount = session.amount_total / 100; // Convert from cents
      // If amount is around 132 (11*12), it's likely yearly
      if (amount >= 120 && amount <= 140) {
        planPeriod = 'yearly';
        planType = 'pro_yearly';
      } else if (amount >= 10 && amount <= 15) {
        planPeriod = 'monthly';
        planType = 'pro';
      }
    }
    
    // Check client_reference_id for additional context if needed
    // You could encode plan info in the client_reference_id if needed

    try {
      // Update Cognito user attribute
      await updateUserSubscription(customerEmail, planType, planPeriod);
      
      // Note: DynamoDB storage can be done when user logs in next time
      // or via a separate service role. For now, Cognito is the source of truth.
      
      console.log(`Subscription updated for ${customerEmail}: ${planType} (${planPeriod})`);
      
    } catch (error) {
      console.error('Error updating user subscription:', error);
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
    }
  }

  // Handle subscription updates
  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object;
    // Handle subscription changes (e.g., plan upgrades/downgrades)
    console.log('Subscription updated:', subscription.id);
  }

  // Handle subscription cancellations
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    // Handle subscription cancellation
    console.log('Subscription cancelled:', subscription.id);
    
    // You might want to update the user's subscription status to 'cancelled' or 'free'
    // This would require looking up the user by Stripe customer ID
  }

  return NextResponse.json({ received: true });
}
