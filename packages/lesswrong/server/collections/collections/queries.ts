import schema from "@/lib/collections/collections/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { CollectionsViews } from "@/lib/collections/collections/views";

export const graphqlCollectionQueryTypeDefs = gql`
  type Collection ${ getAllGraphQLFields(schema) }
  
  input SingleCollectionInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleCollectionOutput {
    result: Collection
  }
  
  input CollectionDefaultViewInput {
    collectionIds: [String!]
  }
  
  input CollectionSelector  {
    default: CollectionDefaultViewInput
  }
  
  input MultiCollectionInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiCollectionOutput {
    results: [Collection!]!
    totalCount: Int
  }
  
  extend type Query {
    collection(
      input: SingleCollectionInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleCollectionOutput
    collections(
      input: MultiCollectionInput @deprecated(reason: "Use the selector field instead"),
      selector: CollectionSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiCollectionOutput
  }
`;
export const collectionGqlQueryHandlers = getDefaultResolvers('Collections', CollectionsViews);
export const collectionGqlFieldResolvers = getFieldGqlResolvers('Collections', schema);
