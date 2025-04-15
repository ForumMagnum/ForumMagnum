import schema from "@/lib/collections/useractivities/newSchema";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlUserActivityQueryTypeDefs = gql`
  type UserActivity {
    ${getAllGraphQLFields(schema)}
  }
`;

export const userActivityGqlFieldResolvers = getFieldGqlResolvers('UserActivities', schema);
