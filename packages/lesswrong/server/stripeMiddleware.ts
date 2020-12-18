import { DatabaseServerSetting } from './databaseSettings';
import Stripe from 'stripe';


const stripePrivateKeySetting = new DatabaseServerSetting<null|string>('stripe.privateKey', null)
const stripeURLRedirect = new DatabaseServerSetting<null|string>('stripe.redirectTarget', 'https://lesswrong.com')

export const addStripeMiddleware = (addMiddleware) => {
  const stripePrivateKey = stripePrivateKeySetting.get()
  const stripe = stripePrivateKey && new Stripe(stripePrivateKey, {apiVersion: '2020-08-27'})
  
  const stripeMiddleware = async (req, res) => {
    if (req.method === "POST" && stripe) {
      const redirectTarget = stripeURLRedirect.get()
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        shipping_address_collection: {
          allowed_countries: [
            // European Countries: https://www.europeancuisines.com/Europe-European-Two-Letter-Country-Code-Abbreviations
            'AL', 'AD', 'AM', 'AT', 'BY', 'BE', 'BA', 'BG', 'CH', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FO', 'FI', 'FR', 'GB', 'GE', 'GI', 'GR', 'HU', 'HR', 'IE', 'IS', 'IT', 'LT', 'LU', 'LV', 'MC', 'MK', 'MT', 'NO', 'NL', 'PT', 'RO', 'SE', 'SI', 'SK', 'SM', 'TR', 'UA', 'VA', 'PL',
            // North American Countries
            'US', 'MX', 'CA',
            // Oceania Countries
            'AU', 'NZ',
            // Israel (Maybe shippable via Amazon North America?)
            'IL'
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
