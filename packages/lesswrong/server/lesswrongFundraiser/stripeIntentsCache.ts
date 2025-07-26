import type Stripe from 'stripe';
import * as Sentry from '@sentry/nextjs';
import { lightconeFundraiserPaymentLinkId } from '@/lib/instanceSettings';
import { lightconeFundraiserStripeSecretKeySetting } from '../databaseSettings';
export type SucceededPaymentIntent = Stripe.PaymentIntent & { status: 'succeeded' };

export const stripeIntentsCache: { intents: SucceededPaymentIntent[] } = { intents: [] };

let stripe: Stripe | undefined = undefined;

const getStripe = async () => {
  if (stripe) return stripe;
  let stripeSecretKey = lightconeFundraiserStripeSecretKeySetting.get();
  if (!stripeSecretKey) return;
  const { Stripe } = await import('stripe');
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-11-20.acacia',
  });
  return stripe;
}

let lastUpdatedAt = new Date();

export async function updateStripeIntentsCache() {
  const stripe = await getStripe();
  if (!stripe) return;
  try {
    const succeededPaymentIntents = [];
    let hasMore = true;
    let startingAfter: string | undefined = undefined;

    while (hasMore) {
      const sessions: Stripe.Response<Stripe.ApiList<Stripe.Checkout.Session>> = await stripe.checkout.sessions.list({
        payment_link: lightconeFundraiserPaymentLinkId.get(),
        limit: 100,
        starting_after: startingAfter,
        expand: ['data.payment_intent'],
      });

      for (const session of sessions.data) {
        const paymentIntent = session.payment_intent;
        if (paymentIntent && typeof paymentIntent !== 'string' && paymentIntent.status === 'succeeded') {
          succeededPaymentIntents.push(paymentIntent as SucceededPaymentIntent);
        }
      }

      hasMore = sessions.has_more;
      if (hasMore) {
        startingAfter = sessions.data[sessions.data.length - 1].id;
      }
    }

    stripeIntentsCache.intents = succeededPaymentIntents;
  } catch (error) {
    Sentry.captureException(error);
  }
}

export function getStripeIntentsCache(): SucceededPaymentIntent[] {
  if (new Date().getTime() - lastUpdatedAt.getTime() > 1000 * 60) {
    void updateStripeIntentsCache();
  }
  return structuredClone(stripeIntentsCache.intents);
}

export function setStripeIntentsCache(intents: SucceededPaymentIntent[]) {
  stripeIntentsCache.intents = intents;
}

