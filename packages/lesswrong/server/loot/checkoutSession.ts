import { getSiteUrl } from "@/lib/vulcan-lib/utils";
import { getContextFromReqAndRes } from "../vulcan-lib/apollo-server/context";
import { addStaticRoute } from "../vulcan-lib/staticRoutes";
import { getStripe } from "./stripe";

addStaticRoute('/loot-checkout-session', async (props, req, res) => {
  const stripe = getStripe();
  if (!stripe) {
    res.status(500).send('No Stripe client, probably missing secret key');
    return;
  }

  const context = await getContextFromReqAndRes({ req, res, isSSR: false });
  const { currentUser } = context;
  if (!currentUser) {
    res.status(401).send('Unauthorized');
    return;
  }

  const userId = currentUser._id;

  const checkoutSession = await stripe.checkout.sessions.create({
    line_items: [{
      price: 'price_1R913oBlb9vL5IMTFXYNpFWR',
      quantity: 1,
    }],
    metadata: {
      userId,
    },
    mode: 'payment',
    success_url: `${getSiteUrl()}`,
    cancel_url: `${getSiteUrl()}`,
  });

  if (!checkoutSession.url) {
    res.status(500).send('No checkout session URL');
    return;
  }

  res.json({ url: checkoutSession.url });
  return;
});
