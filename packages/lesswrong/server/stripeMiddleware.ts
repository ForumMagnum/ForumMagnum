import { DatabaseServerSetting } from './databaseSettings';
import Stripe from 'stripe';
import type { Request, Response } from 'express-serve-static-core';
import type { AddMiddlewareType } from './apolloServer';

const stripePrivateKeySetting = new DatabaseServerSetting<null|string>('stripe.privateKey', null)
const stripeURLRedirect = new DatabaseServerSetting<null|string>('stripe.redirectTarget', 'https://lesswrong.com')

export const addStripeMiddleware = (addMiddleware: AddMiddlewareType) => {
  const stripePrivateKey = stripePrivateKeySetting.get()
  const stripe = stripePrivateKey && new Stripe(stripePrivateKey, {apiVersion: '2020-08-27'})
  
  const stripeMiddleware = async (req: Request, res: Response) => {
    if (req.method === "POST" && stripe) {
      const redirectTarget = stripeURLRedirect.get()
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        shipping_address_collection: {
          allowed_countries: [
            // European Countries: https://www.europeancuisines.com/Europe-European-Two-Letter-Country-Code-Abbreviations
            'AL', 'AD', 'AM', 'AT', 'BE', 'BA', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FO', 'FI', 'FR', 'GB', 'GE', 'GR', 'HU', 'HR', 'IE', 'IT', 'LT', 'LU', 'LV', 'MC', 'MK', 'MT', 'NL', 'PT', 'RO', 'SE', 'SI', 'SK', 'SM', 'VA', 'PL',
            // Tricky European Countries -- excluding for now, can add back later if we find a good shipping solution
              // 'BY', 'CH', 'GI', 'IS', 'NO', 'TR', 'UA',
            // North American Countries
            'US', 'CA',
            // Oceania Countries
            'AU'    
          ]
        },
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'A Map That Reflects the Territory',
                images: ['https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606805322/w_1966_jahgq7.png'],
              },
              unit_amount: 2900,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${redirectTarget}?success=true`,
        cancel_url: `${redirectTarget}?canceled=true`,
      });
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ id: session.id }));
    }
  }
  if (stripePrivateKey && stripe) {
    addMiddleware("/create-session", stripeMiddleware);
  }
}
