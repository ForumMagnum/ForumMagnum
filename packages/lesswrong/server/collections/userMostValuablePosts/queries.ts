import schema from "@/lib/collections/userMostValuablePosts/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { UserMostValuablePostsViews } from "@/lib/collections/userMostValuablePosts/views";

export const graphqlUserMostValuablePostQueryTypeDefs = gql`
  type UserMostValuablePost ${ getAllGraphQLFields(schema) }
  
  input SingleUserMostValuablePostInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleUserMostValuablePostOutput {
    result: UserMostValuablePost
  }
  
  input UserMostValuablePostDefaultViewInput
  
  input UserMostValuablePostsCurrentUserMostValuablePostsInput
  
  input UserMostValuablePostsCurrentUserPostInput {
    postId: String
  }
  
  input UserMostValuablePostSelector  {
    default: UserMostValuablePostDefaultViewInput
    currentUserMostValuablePosts: UserMostValuablePostsCurrentUserMostValuablePostsInput
    currentUserPost: UserMostValuablePostsCurrentUserPostInput
  }
  
  input MultiUserMostValuablePostInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiUserMostValuablePostOutput {
    results: [UserMostValuablePost]
    totalCount: Int
  }
  
  extend type Query {
    userMostValuablePost(
      input: SingleUserMostValuablePostInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleUserMostValuablePostOutput
    userMostValuablePosts(
      input: MultiUserMostValuablePostInput @deprecated(reason: "Use the selector field instead"),
      selector: UserMostValuablePostSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiUserMostValuablePostOutput
  }
`;
export const userMostValuablePostGqlQueryHandlers = getDefaultResolvers('UserMostValuablePosts', UserMostValuablePostsViews);
export const userMostValuablePostGqlFieldResolvers = getFieldGqlResolvers('UserMostValuablePosts', schema);
