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
  const viewName = "To Sync 2025";

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

  const recordsWithAmount = records.map((record: AnyBecauseIsInput) => ({...record, amount: parseInt(record.fields["Amount"] ?? 0)}));

  const incompleteEveryorg = recordsWithAmount.filter((record: AnyBecauseIsInput) => record.fields["Platform"] === "Every.org (Incomplete)");
  const completeEveryorg = recordsWithAmount.filter((record: AnyBecauseIsInput) => record.fields["Platform"] === "Every.org");
  const nonEveryorg = recordsWithAmount.filter((record: AnyBecauseIsInput) => record.fields["Platform"] !== "Every.org" && record.fields["Platform"] !== "Every.org (Incomplete)");

  const unmatchedIncompleteEveryorg = incompleteEveryorg
    .filter((record: AnyBecauseIsInput) =>
        !completeEveryorg.some((completeRecord: AnyBecauseIsInput) =>
          completeRecord.fields["Name"] === record.fields["Name"]
          && Math.abs(completeRecord.amount - record.amount)/completeRecord.amount < 0.2
        )
    );

  return [...unmatchedIncompleteEveryorg, ...completeEveryorg, ...nonEveryorg].reduce((acc, {amount}) => acc + amount, 0);
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
