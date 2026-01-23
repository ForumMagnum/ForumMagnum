import schema from "@/lib/collections/yjsDocuments/newSchema";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlYjsDocumentQueryTypeDefs = gql`
  type YjsDocument ${ getAllGraphQLFields(schema) }
`;

export const yjsDocumentGqlFieldResolvers = getFieldGqlResolvers('YjsDocuments', schema);
