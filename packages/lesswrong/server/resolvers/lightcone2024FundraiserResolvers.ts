import { getStripeIntentsCache } from "../lesswrongFundraiser/stripeIntentsCache";
import { lightconeFundraiserStripeSecretKeySetting } from "../databaseSettings";
import gql from "graphql-tag";
import { airtableApiKeySetting } from "@/lib/instanceSettings";
import { unstable_cache } from "next/cache";

export const lightcone2024FundraiserGraphQLTypeDefs = gql`
  extend type Query {
    Lightcone2024FundraiserStripeAmounts: [Int!]
    Lightcone2025FundraiserAirtableAmounts: Int!
  }
`

async function fetchAirtableDonationRecords(): Promise<number> {
  const baseId = "appUepxJdxacpehZz";
  const tableName = "Donations";
  const viewName = "Every.org";

  const apiKey = airtableApiKeySetting.get();
  if (!apiKey) {
    throw new Error("Can't fetch Airtable records without an API key");
  }

  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?view=${encodeURIComponent(viewName)}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Airtable API responded with status ${response.status} - ${response.statusText}`);
  }

  const data = await response.json();
  const records: AnyBecauseIsInput[] = data.records ?? [];

  return records
    .filter((record: AnyBecauseIsInput) => {
      if (!record.fields?.["Date"]) return false;
      const date = new Date(record.fields["Date"]);
      return date > new Date('2025-12-02');
    })
    .map((record: AnyBecauseIsInput) => parseInt(record.fields["Amount"]))
    .reduce((acc, curr) => acc + curr, 0);
}

const fetchCachedAirtableDonationRecords = unstable_cache(fetchAirtableDonationRecords, undefined, { revalidate: 60 * 10 });

export const lightcone2024FundraiserGraphQLQueries = {
  async Lightcone2024FundraiserStripeAmounts(root: void, args: void, context: ResolverContext) {
    if (!lightconeFundraiserStripeSecretKeySetting.get()) return; 
    const intents = getStripeIntentsCache();
    return intents.map(intent => intent.amount);
  },
  async Lightcone2025FundraiserAirtableAmounts(root: void, args: void, context: ResolverContext) {
    return fetchCachedAirtableDonationRecords();
  }
}
