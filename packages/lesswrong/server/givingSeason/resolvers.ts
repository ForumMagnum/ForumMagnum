import { addGraphQLQuery, addGraphQLResolvers } from "@/lib/vulcan-lib";

addGraphQLResolvers({
  Query: {
    GivingSeason2024DonationTotal: (
      _root: void,
      _args: {},
      context: ResolverContext,
    ) => context.repos.databaseMetadata.getGivingSeason2024DonationTotal(),
  },
});

addGraphQLQuery("GivingSeason2024DonationTotal: Float!");
