import schema from "@/lib/collections/cronHistories/newSchema";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlCronHistoryQueryTypeDefs = gql`
  type CronHistory ${
    getAllGraphQLFields(schema)
  }
`;

export const cronHistoryGqlFieldResolvers = getFieldGqlResolvers('CronHistories', schema);
