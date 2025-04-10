import schema from "@/lib/collections/commentModeratorActions/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlCommentModeratorActionQueryTypeDefs = gql`
  type CommentModeratorAction {
    ${getAllGraphQLFields(schema)}
  }

  input SingleCommentModeratorActionInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleCommentModeratorActionOutput {
    result: CommentModeratorAction
  }

  input MultiCommentModeratorActionInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiCommentModeratorActionOutput {
    results: [CommentModeratorAction]
    totalCount: Int
  }

  extend type Query {
    commentModeratorAction(input: SingleCommentModeratorActionInput): SingleCommentModeratorActionOutput
    commentModeratorActions(input: MultiCommentModeratorActionInput): MultiCommentModeratorActionOutput
  }
`;

export const commentModeratorActionGqlQueryHandlers = getDefaultResolvers('CommentModeratorActions');
export const commentModeratorActionGqlFieldResolvers = getFieldGqlResolvers('CommentModeratorActions', schema);
