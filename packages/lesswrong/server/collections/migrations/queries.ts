import schema from "@/lib/collections/migrations/newSchema";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlMigrationQueryTypeDefs = gql`
  type Migration {
    ${getAllGraphQLFields(schema)}
  }
`;

export const migrationGqlFieldResolvers = getFieldGqlResolvers('Migrations', schema);
