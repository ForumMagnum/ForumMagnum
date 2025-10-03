import { getStripeIntentsCache } from "../lesswrongFundraiser/stripeIntentsCache";
import { lightconeFundraiserStripeSecretKeySetting } from "../databaseSettings";
import gql from "graphql-tag";

export const lightcone2024FundraiserGraphQLTypeDefs = gql`
  extend type Query {
    Lightcone2024FundraiserStripeAmounts: [Int!]
  }
`

export const lightcone2024FundraiserGraphQLQueries = {
  async Lightcone2024FundraiserStripeAmounts(root: void, args: void, context: ResolverContext) {
    if (!lightconeFundraiserStripeSecretKeySetting.get()) return; 
    const intents = getStripeIntentsCache();
    return intents.map(intent => intent.amount);
  }
}
