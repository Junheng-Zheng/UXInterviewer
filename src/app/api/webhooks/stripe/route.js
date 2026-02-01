import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { updateUserSubscription, cancelUserSubscription } from '@/lib/cognito';

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
    
    // Get username (email) from session metadata or client_reference_id
    const username = session.metadata?.username || session.client_reference_id;
    
    if (!username) {
      console.error('No username found in session metadata or client_reference_id');
      return NextResponse.json({ error: 'No username found' }, { status: 400 });
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

    try {
      // Update Cognito user attribute using username (email)
      await updateUserSubscription(username, planType, planPeriod);
      
      // Also store username in customer metadata for future subscription events
      if (session.customer) {
        try {
          await stripe.customers.update(session.customer, {
            metadata: {
              username: username,
            },
          });
        } catch (error) {
          console.warn('Failed to update customer metadata:', error);
          // Don't fail the webhook if customer update fails
        }
      }
      
      // Also store username in subscription metadata if subscription exists
      if (session.subscription) {
        try {
          await stripe.subscriptions.update(session.subscription, {
            metadata: {
              username: username,
            },
          });
        } catch (error) {
          console.warn('Failed to update subscription metadata:', error);
          // Don't fail the webhook if subscription update fails
        }
      }
      
      // Note: DynamoDB storage can be done when user logs in next time
      // or via a separate service role. For now, Cognito is the source of truth.
      
      console.log(`Subscription updated for username ${username}: ${planType} (${planPeriod})`);
      
    } catch (error) {
      console.error('Error updating user subscription:', error);
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
    }
  }

  // Handle subscription updates
  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object;
    
    // Get username from subscription metadata or customer metadata
    let username = subscription.metadata?.username;
    
    // If not in subscription metadata, try to get from customer
    if (!username && subscription.customer) {
      try {
        const customer = await stripe.customers.retrieve(subscription.customer);
        if (customer && !customer.deleted) {
          username = customer.metadata?.username;
        }
      } catch (error) {
        console.error('Error retrieving customer:', error);
      }
    }
    
    if (!username) {
      console.error('No username found in subscription or customer metadata');
      return NextResponse.json({ error: 'No username found' }, { status: 400 });
    }

    // Determine plan type and period from subscription items
    let planType = 'pro';
    let planPeriod = 'monthly';
    
    // Check subscription metadata first
    if (subscription.metadata?.plan) {
      planType = subscription.metadata.plan;
    }
    if (subscription.metadata?.period) {
      planPeriod = subscription.metadata.period;
    }
    
    // If not in metadata, determine from subscription items
    if (!subscription.metadata?.plan && subscription.items?.data?.length > 0) {
      const price = subscription.items.data[0].price;
      const amount = price.unit_amount / 100; // Convert from cents
      
      // Determine plan based on amount and interval
      if (price.recurring?.interval === 'year') {
        planPeriod = 'yearly';
        // Yearly plan is typically $132 (11*12)
        if (amount >= 120 && amount <= 140) {
          planType = 'pro_yearly';
        }
      } else if (price.recurring?.interval === 'month') {
        planPeriod = 'monthly';
        // Monthly plan is typically $13
        if (amount >= 10 && amount <= 15) {
          planType = 'pro';
        }
      }
    }

    // Check subscription status - if cancelled or past_due, don't update to active
    const subscriptionStatus = subscription.status;
    if (subscriptionStatus === 'canceled' || subscriptionStatus === 'unpaid' || subscriptionStatus === 'past_due') {
      // Subscription is cancelled or in bad state, cancel in Cognito
      try {
        await cancelUserSubscription(username);
        console.log(`Subscription cancelled for username ${username}: ${subscription.id}`);
      } catch (error) {
        console.error('Error cancelling user subscription:', error);
        return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
      }
    } else {
      // Active subscription, update normally
      try {
        await updateUserSubscription(username, planType, planPeriod);
        console.log(`Subscription updated for username ${username}: ${planType} (${planPeriod}) - Status: ${subscriptionStatus}`);
      } catch (error) {
        console.error('Error updating user subscription:', error);
        return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
      }
    }
  }

  // Handle subscription cancellations
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    
    // Get username from subscription metadata or customer metadata
    let username = subscription.metadata?.username;
    
    // If not in subscription metadata, try to get from customer
    if (!username && subscription.customer) {
      try {
        const customer = await stripe.customers.retrieve(subscription.customer);
        if (customer && !customer.deleted) {
          username = customer.metadata?.username;
        }
      } catch (error) {
        console.error('Error retrieving customer:', error);
      }
    }
    
    if (!username) {
      console.error('No username found in subscription or customer metadata');
      return NextResponse.json({ error: 'No username found' }, { status: 400 });
    }

    try {
      await cancelUserSubscription(username);
      console.log(`Subscription cancelled for username ${username}: ${subscription.id}`);
    } catch (error) {
      console.error('Error cancelling user subscription:', error);
      return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
