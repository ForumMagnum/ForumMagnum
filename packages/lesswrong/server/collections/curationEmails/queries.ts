import schema from "@/lib/collections/curationEmails/newSchema";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlCurationEmailQueryTypeDefs = gql`
  type CurationEmail {
    ${getAllGraphQLFields(schema)}
  }
`;

export const curationEmailGqlFieldResolvers = getFieldGqlResolvers('CurationEmails', schema);
