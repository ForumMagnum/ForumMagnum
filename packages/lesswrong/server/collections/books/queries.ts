import schema from "@/lib/collections/books/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { CollectionViewSet } from "@/lib/views/collectionViewSet";

export const graphqlBookQueryTypeDefs = gql`
  type Book ${ getAllGraphQLFields(schema) }
  
  input SingleBookInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleBookOutput {
    result: Book
  }
  
  input BookViewInput
  
  input BookSelector  {
    default: BookViewInput
  }
  
  input MultiBookInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiBookOutput {
    results: [Book]
    totalCount: Int
  }
  
  extend type Query {
    book(
      input: SingleBookInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleBookOutput
    books(
      input: MultiBookInput @deprecated(reason: "Use the selector field instead"),
      selector: BookSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiBookOutput
  }
`;
export const bookGqlQueryHandlers = getDefaultResolvers('Books', new CollectionViewSet('Books', {}));
export const bookGqlFieldResolvers = getFieldGqlResolvers('Books', schema);
