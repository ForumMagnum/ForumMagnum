import { stripeLootSecretKey } from "../databaseSettings";
import Stripe from 'stripe';

export const getStripe = (() => {
  let stripe: Stripe | undefined;
  return () => {
    if (stripe) return stripe;
    const secretKey = stripeLootSecretKey.get() || process.env.STRIPE_LOOT_SECRET_KEY;
    if (!secretKey) return;
    stripe = new Stripe(secretKey, {
      apiVersion: '2024-11-20.acacia',
    });
    return stripe;
  };
})();
