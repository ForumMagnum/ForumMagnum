import { addStaticRoute } from "../vulcan-lib/staticRoutes";
import Stripe from 'stripe';
import { captureException } from '@sentry/core';
import { stripeLootWebhookSecret } from "../databaseSettings";
import { getStripe } from "./stripe";

addStaticRoute('/loot-webhook', async (props, req, res) => {
  if (req.method !== 'POST') {
    // eslint-disable-next-line no-console
    console.log('Method not allowed');
    res.statusCode = 405;
    res.end('Method not allowed');
    return;
  }

  // TODO: add the actual secret to the DB when we create the webhook in Stripe
  const webhookSecret = stripeLootWebhookSecret.get() || process.env.STRIPE_LOOT_WEBHOOK_SECRET;
  if (!webhookSecret) {
    // eslint-disable-next-line no-console
    console.log('No webhook secret');
    res.statusCode = 500;
    res.end('No webhook secret');
    return;
  }

  const stripe = getStripe();
  if (!stripe) {
    // eslint-disable-next-line no-console
    console.log('No Stripe client, probably missing secret key');
    res.statusCode = 500;
    res.end('No Stripe client, probably missing secret key');
    return;
  }

  try {
    const body = req.body;
    const signature = req.headers['stripe-signature'];
  
    if (!signature) {
    // eslint-disable-next-line no-console
      console.log('No signature');
      res.statusCode = 400;
      res.end('No signature');
      return;
    }
  
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const paymentIntentId = paymentIntent.id;
  
      const charges = await stripe.charges.list({
        payment_intent: paymentIntentId,
      });
  
      const checkoutSessions = await stripe.checkout.sessions.list({
        payment_intent: paymentIntentId,
        expand: ['data.custom_fields', 'data.customer_details', 'data.line_items', 'data.line_items.data.price']
      });
  
      if (checkoutSessions.data.length === 0 || charges.data.length === 0) {
        // No checkouts or charges found; shouldn't happen in practice?
        // eslint-disable-next-line no-console
        console.log('No checkouts or charges found; shouldn\'t happen in practice?');
        res.statusCode = 200;
        res.end('Okay');
        return;
      }
  
      const checkoutSession = checkoutSessions.data[0];
      const checkoutMetadata = checkoutSession.metadata;
  
      if (!checkoutMetadata) {
        // TODO: do we need to refund here or something?
        // No metadata found; again, shouldn't happen in practice?
        // eslint-disable-next-line no-console
        console.log('No metadata found; again, shouldn\'t happen in practice?');
        res.statusCode = 200;
        res.end('Okay');
        return;
      }
  
      const { userId } = checkoutMetadata;
      if (!userId) {
        // TODO: do we need to refund here or something?
        // No user ID found; again, shouldn't happen in practice?
        // eslint-disable-next-line no-console
        console.log('No user ID found; again, shouldn\'t happen in practice?'); 
        res.statusCode = 200;
        res.end('Okay');
        return;
      }
  
      const charge = charges.data[0];
      const chargeAmount = charge.amount;
  
      const picoLightconesPurchased = Math.floor(chargeAmount / 100);
      
      // eslint-disable-next-line no-console
      console.log(`User ${userId} purchased ${picoLightconesPurchased} pico-lightcones`);
  
      // TODO: wire this up to the inventory system to deposit the lightcones based on userId
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    captureException(error);
    res.statusCode = 500;
    res.end('Internal server error');
    return;
  }

  res.statusCode = 200;
  res.end('Okay');
  return;
});
