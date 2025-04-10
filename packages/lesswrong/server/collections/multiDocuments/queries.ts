import schema from "@/lib/collections/multiDocuments/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlMultiDocumentQueryTypeDefs = gql`
  type MultiDocument {
    ${getAllGraphQLFields(schema)}
  }

  input SingleMultiDocumentInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleMultiDocumentOutput {
    result: MultiDocument
  }

  input MultiMultiDocumentInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiMultiDocumentOutput {
    results: [MultiDocument]
    totalCount: Int
  }

  extend type Query {
    multiDocument(input: SingleMultiDocumentInput): SingleMultiDocumentOutput
    multiDocuments(input: MultiMultiDocumentInput): MultiMultiDocumentOutput
  }
`;

export const multiDocumentGqlQueryHandlers = getDefaultResolvers('MultiDocuments');
export const multiDocumentGqlFieldResolvers = getFieldGqlResolvers('MultiDocuments', schema);
