import schema from "@/lib/collections/fieldChanges/newSchema";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlFieldChangeQueryTypeDefs = gql`
  type FieldChange ${
    getAllGraphQLFields(schema)
  }
`;

export const fieldChangeGqlFieldResolvers = getFieldGqlResolvers('FieldChanges', schema);
