import schema from "@/lib/collections/postViewTimes/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { CollectionViewSet } from "@/lib/views/collectionViewSet";

export const graphqlPostViewTimeQueryTypeDefs = gql`
  type PostViewTime ${ getAllGraphQLFields(schema) }
  
  input SinglePostViewTimeInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SinglePostViewTimeOutput {
    result: PostViewTime
  }
  
  input PostViewTimeViewInput
  
  input PostViewTimeSelector  {
    default: PostViewTimeViewInput
  }
  
  input MultiPostViewTimeInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiPostViewTimeOutput {
    results: [PostViewTime]
    totalCount: Int
  }
  
  extend type Query {
    postViewTime(
      input: SinglePostViewTimeInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SinglePostViewTimeOutput
    postViewTimes(
      input: MultiPostViewTimeInput @deprecated(reason: "Use the selector field instead"),
      selector: PostViewTimeSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiPostViewTimeOutput
  }
`;
export const postViewTimeGqlQueryHandlers = getDefaultResolvers('PostViewTimes', new CollectionViewSet('PostViewTimes', {}));
export const postViewTimeGqlFieldResolvers = getFieldGqlResolvers('PostViewTimes', schema);
