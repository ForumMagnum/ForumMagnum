import schema from "@/lib/collections/multiDocuments/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { MultiDocumentsViews } from "@/lib/collections/multiDocuments/views";

export const graphqlMultiDocumentQueryTypeDefs = gql`
  type MultiDocument ${ getAllGraphQLFields(schema) }

  enum MultiDocumentCollectionName {
    Tags
    MultiDocuments
  }
  
  enum MultiDocumentFieldName {
    description
    summary
  }
  
  input SingleMultiDocumentInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleMultiDocumentOutput {
    result: MultiDocument
  }
  
  input MultiDocumentDefaultViewInput {
    excludedDocumentIds: [String!]
  }
  
  input MultiDocumentsLensBySlugInput {
    excludedDocumentIds: [String!]
    slug: String
  }
  
  input MultiDocumentsSummariesByParentIdInput {
    excludedDocumentIds: [String!]
    parentDocumentId: String
  }
  
  input MultiDocumentsPingbackLensPagesInput {
    excludedDocumentIds: [String!]
    documentId: String
  }
  
  input MultiDocumentSelector  {
    default: MultiDocumentDefaultViewInput
    lensBySlug: MultiDocumentsLensBySlugInput
    summariesByParentId: MultiDocumentsSummariesByParentIdInput
    pingbackLensPages: MultiDocumentsPingbackLensPagesInput
  }
  
  input MultiMultiDocumentInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiMultiDocumentOutput {
    results: [MultiDocument!]!
    totalCount: Int
  }
  
  extend type Query {
    multiDocument(
      input: SingleMultiDocumentInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleMultiDocumentOutput
    multiDocuments(
      input: MultiMultiDocumentInput @deprecated(reason: "Use the selector field instead"),
      selector: MultiDocumentSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiMultiDocumentOutput
  }
`;
export const multiDocumentGqlQueryHandlers = getDefaultResolvers('MultiDocuments', MultiDocumentsViews);
export const multiDocumentGqlFieldResolvers = getFieldGqlResolvers('MultiDocuments', schema);
