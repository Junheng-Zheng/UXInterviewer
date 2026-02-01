import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { UpdateUserAttributesCommand } from '@aws-sdk/client-cognito-identity-provider';
import { cognitoClient, updateUserSubscription } from '@/lib/cognito';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

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

        if(!customerEmail) {
            console.error('No customer email found in session');
            return NextResponse.json({ error: 'No customer email' }, { status: 400 });
        }

        // Determine plan type from metadata, client_reference_id, or amount
        const priceId = session.amount_total;
        let planType = 'pro';
        let planPeriod = 'monthly';

        // Check session metadata for plan details
        if (session.metadata?.plan) {
            planType = session.metadata.plan;
        }
        if (session.metadata?.period) {
            planPeriod = session.metadata.period;
        }
        if (session.metadata?.amount_total) {
            if (session.metadata.amount_total == 13200) {
                planPeriod = 'yearly';
                planType = 'pro_yearly';
            } else if (session.metadata.amount_total == 1300) {
                planPeriod = 'monthly';
                planType = 'pro';
            }
        }

        try {
            await updateUserSubscription(customerEmail, planType, planPeriod);
            console.log(`Subscription updated for ${customerEmail}: ${planType} (${planPeriod})`);
        } catch (error) {
            console.error('Error updating user subscription:', error);
            return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
        }
    }

    return NextResponse.json({ received: true });
}

