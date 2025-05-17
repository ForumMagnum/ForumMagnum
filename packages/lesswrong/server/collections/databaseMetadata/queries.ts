import schema from "@/lib/collections/databaseMetadata/newSchema";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlDatabaseMetadataQueryTypeDefs = gql`
  type DatabaseMetadata ${
    getAllGraphQLFields(schema)
  }
`;

export const databaseMetadataGqlFieldResolvers = getFieldGqlResolvers('DatabaseMetadata', schema);
