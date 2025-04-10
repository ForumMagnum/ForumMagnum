import schema from "@/lib/collections/tweets/newSchema";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlTweetQueryTypeDefs = gql`
  type Tweet {
    ${getAllGraphQLFields(schema)}
  }
`;

export const tweetGqlFieldResolvers = getFieldGqlResolvers('Tweets', schema);
