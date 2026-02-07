import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { getSession } from '@/lib/session';
import { getCognitoUsername } from '@/lib/cognito-username';
import { cognitoClient } from '@/lib/cognito';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;

/**
 * Get Stripe subscription data for the authenticated user.
 * Uses stored Stripe customer ID from Cognito when present; otherwise looks up by email.
 */
export async function GET() {
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
      return NextResponse.json({
        hasSubscription: false,
        customer: null,
        subscription: null,
        paymentMethod: null,
        invoices: [],
      });
    }

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all', // Get all subscriptions (active, past_due, canceled, etc.)
      limit: 10,
    });

    // Find the most recent active subscription, or the most recent one
    const activeSubscription = subscriptions.data.find(
      sub => sub.status === 'active' || sub.status === 'trialing'
    ) || subscriptions.data[0] || null;

    // Get payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customer.id,
      type: 'card',
      limit: 10,
    });

    // Get the default payment method or the first one
    let paymentMethod = null;
    if (activeSubscription?.default_payment_method) {
      try {
        paymentMethod = await stripe.paymentMethods.retrieve(
          activeSubscription.default_payment_method
        );
      } catch (error) {
        console.warn('Error retrieving default payment method:', error);
      }
    }
    
    if (!paymentMethod && paymentMethods.data.length > 0) {
      paymentMethod = paymentMethods.data[0];
    }

    // Get recent invoices
    const invoices = await stripe.invoices.list({
      customer: customer.id,
      limit: 10,
    });

    // Format subscription data
    let subscriptionData = null;
    if (activeSubscription) {
      const price = activeSubscription.items.data[0]?.price;
      const amount = price?.unit_amount ? price.unit_amount / 100 : 0;
      const currency = price?.currency?.toUpperCase() || 'USD';
      const interval = price?.recurring?.interval || 'month';
      
      // Determine plan name based on amount and interval
      let planName = 'Pro';
      if (interval === 'year') {
        planName = 'Pro Yearly';
      }

      subscriptionData = {
        id: activeSubscription.id,
        status: activeSubscription.status,
        planName: planName,
        amount: amount,
        currency: currency,
        interval: interval,
        currentPeriodStart: activeSubscription.current_period_start 
          ? new Date(activeSubscription.current_period_start * 1000).toISOString()
          : null,
        currentPeriodEnd: activeSubscription.current_period_end
          ? new Date(activeSubscription.current_period_end * 1000).toISOString()
          : null,
        cancelAtPeriodEnd: activeSubscription.cancel_at_period_end,
      };
    }

    // Format payment method data
    let paymentMethodData = null;
    if (paymentMethod && paymentMethod.card) {
      const card = paymentMethod.card;
      paymentMethodData = {
        id: paymentMethod.id,
        brand: card.brand,
        last4: card.last4,
        expMonth: card.exp_month,
        expYear: card.exp_year,
        displayText: `${card.brand.charAt(0).toUpperCase() + card.brand.slice(1)} ending in ${card.last4} • Expires ${String(card.exp_month).padStart(2, '0')}/${String(card.exp_year).slice(-2)}`,
      };
    }

    // Format customer data
    const customerData = {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
      address: customer.address ? {
        line1: customer.address.line1,
        line2: customer.address.line2,
        city: customer.address.city,
        state: customer.address.state,
        postal_code: customer.address.postal_code,
        country: customer.address.country,
      } : null,
    };

    // Format invoices data
    const invoicesData = invoices.data.map(invoice => ({
      id: invoice.id,
      number: invoice.number,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency?.toUpperCase() || 'USD',
      status: invoice.status,
      date: new Date(invoice.created * 1000).toISOString(),
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      invoicePdf: invoice.invoice_pdf,
    }));

    return NextResponse.json({
      hasSubscription: !!activeSubscription,
      customer: customerData,
      subscription: subscriptionData,
      paymentMethod: paymentMethodData,
      invoices: invoicesData,
    });
  } catch (error) {
    console.error('Error fetching Stripe subscription data:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch subscription data',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
