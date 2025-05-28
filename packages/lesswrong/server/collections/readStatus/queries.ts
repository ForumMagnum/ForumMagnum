import schema from "@/lib/collections/readStatus/newSchema";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlReadStatusQueryTypeDefs = gql`
  type ReadStatus ${
    getAllGraphQLFields(schema)
  }
`;

export const readStatusGqlFieldResolvers = getFieldGqlResolvers('ReadStatuses', schema);
