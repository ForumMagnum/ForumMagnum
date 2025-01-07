import Stripe from "stripe";
import { getStripeIntentsCache } from "../lesswrongFundraiser/stripeIntentsCache";
import { lightconeFundraiserStripeSecretKeySetting } from "../serverSettings";
import { addGraphQLQuery, addGraphQLResolvers, addGraphQLSchema } from "../vulcan-lib";

const intentToAmount = (intent: Stripe.PaymentIntent) => intent.amount

const lightcone2024FundraiserResolvers = {
  Query: {
    async Lightcone2024FundraiserStripeAmounts(root: void, args: void, context: ResolverContext) {
      if (!lightconeFundraiserStripeSecretKeySetting.get()) return; 
      const intents = getStripeIntentsCache();
      return intents.map(intentToAmount);
    }
  }
}
addGraphQLResolvers(lightcone2024FundraiserResolvers);

addGraphQLQuery('Lightcone2024FundraiserStripeAmounts: [Int!]');
