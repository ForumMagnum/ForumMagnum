import schema from "@/lib/collections/comments/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlCommentQueryTypeDefs = gql`
  enum TagCommentType {
    SUBFORUM
    DISCUSSION
  }

  type Comment ${
    getAllGraphQLFields(schema)
  }

  input SingleCommentInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleCommentOutput {
    result: Comment
  }

  input MultiCommentInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiCommentOutput {
    results: [Comment]
    totalCount: Int
  }

  extend type Query {
    comment(input: SingleCommentInput): SingleCommentOutput
    comments(input: MultiCommentInput): MultiCommentOutput
  }
`;

export const commentGqlQueryHandlers = getDefaultResolvers('Comments');
export const commentGqlFieldResolvers = getFieldGqlResolvers('Comments', schema);
