import schema from "@/lib/collections/postViews/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { CollectionViewSet } from "@/lib/views/collectionViewSet";

export const graphqlPostViewQueryTypeDefs = gql`
  type PostViews ${ getAllGraphQLFields(schema) }
  
  input SinglePostViewInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SinglePostViewOutput {
    result: PostViews
  }
  
  input PostViewViewInput
  
  input PostViewSelector  {
    default: PostViewViewInput
  }
  
  input MultiPostViewInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiPostViewOutput {
    results: [PostViews]
    totalCount: Int
  }
  
  extend type Query {
    postViews(
      input: SinglePostViewInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SinglePostViewOutput
    postViewses(
      input: MultiPostViewInput @deprecated(reason: "Use the selector field instead"),
      selector: PostViewSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiPostViewOutput
  }
`;
export const postViewGqlQueryHandlers = getDefaultResolvers('PostViews', new CollectionViewSet('PostViews', {}));
export const postViewGqlFieldResolvers = getFieldGqlResolvers('PostViews', schema);
