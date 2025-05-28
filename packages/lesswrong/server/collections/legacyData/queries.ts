import schema from "@/lib/collections/legacyData/newSchema";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlLegacyDataQueryTypeDefs = gql`
  type LegacyData ${
    getAllGraphQLFields(schema)
  }
`;

export const legacyDataGqlFieldResolvers = getFieldGqlResolvers('LegacyData', schema);
