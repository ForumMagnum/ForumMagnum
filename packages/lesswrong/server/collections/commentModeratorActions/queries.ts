import schema from "@/lib/collections/commentModeratorActions/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { CommentModeratorActionsViews } from "@/lib/collections/commentModeratorActions/views";

export const graphqlCommentModeratorActionQueryTypeDefs = gql`
  type CommentModeratorAction ${ getAllGraphQLFields(schema) }
  
  input SingleCommentModeratorActionInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleCommentModeratorActionOutput {
    result: CommentModeratorAction
  }
  
  input CommentModeratorActionsActiveCommentModeratorActionsInput {
    limit: String
  }
  
  input CommentModeratorActionSelector {
    default: EmptyViewInput
    activeCommentModeratorActions: CommentModeratorActionsActiveCommentModeratorActionsInput
  }
  
  input MultiCommentModeratorActionInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiCommentModeratorActionOutput {
    results: [CommentModeratorAction!]!
    totalCount: Int
  }
  
  extend type Query {
    commentModeratorAction(
      input: SingleCommentModeratorActionInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleCommentModeratorActionOutput
    commentModeratorActions(
      input: MultiCommentModeratorActionInput @deprecated(reason: "Use the selector field instead"),
      selector: CommentModeratorActionSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiCommentModeratorActionOutput
  }
`;
export const commentModeratorActionGqlQueryHandlers = getDefaultResolvers('CommentModeratorActions', CommentModeratorActionsViews);
export const commentModeratorActionGqlFieldResolvers = getFieldGqlResolvers('CommentModeratorActions', schema);
