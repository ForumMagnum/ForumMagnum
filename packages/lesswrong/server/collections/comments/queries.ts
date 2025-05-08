import schema from "@/lib/collections/comments/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { CommentsViews } from "@/lib/collections/comments/views";

export const graphqlCommentQueryTypeDefs = gql`
  type Comment ${ getAllGraphQLFields(schema) }
  
  input SingleCommentInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleCommentOutput {
    result: Comment
  }
  
  input CommentViewInput {
    postId: String
    userId: String
    tagId: String
    forumEventId: String
    relevantTagId: String
    maxAgeDays: String
    parentCommentId: String
    parentAnswerId: String
    topLevelCommentId: String
    legacyId: String
    authorIsUnreviewed: String
    sortBy: String
    before: String
    after: String
    reviewYear: String
    profileTagIds: String
    shortformFrontpage: String
    showCommunity: String
    commentIds: String
    minimumKarma: String
   }
  
  input CommentSelector @oneOf {
    default: CommentViewInput
    commentReplies: CommentViewInput
    postCommentsDeleted: CommentViewInput
    allCommentsDeleted: CommentViewInput
    checkedByModGPT: CommentViewInput
    postCommentsTop: CommentViewInput
    postCommentsRecentReplies: CommentViewInput
    postCommentsMagic: CommentViewInput
    afPostCommentsTop: CommentViewInput
    postCommentsOld: CommentViewInput
    postCommentsNew: CommentViewInput
    postCommentsBest: CommentViewInput
    postLWComments: CommentViewInput
    profileRecentComments: CommentViewInput
    profileComments: CommentViewInput
    allRecentComments: CommentViewInput
    recentComments: CommentViewInput
    afSubmissions: CommentViewInput
    rejected: CommentViewInput
    recentDiscussionThread: CommentViewInput
    afRecentDiscussionThread: CommentViewInput
    postsItemComments: CommentViewInput
    sunshineNewCommentsList: CommentViewInput
    questionAnswers: CommentViewInput
    legacyIdComment: CommentViewInput
    sunshineNewUsersComments: CommentViewInput
    defaultModeratorResponses: CommentViewInput
    repliesToAnswer: CommentViewInput
    answersAndReplies: CommentViewInput
    topShortform: CommentViewInput
    shortform: CommentViewInput
    shortformFrontpage: CommentViewInput
    repliesToCommentThread: CommentViewInput
    shortformLatestChildren: CommentViewInput
    nominations2018: CommentViewInput
    nominations2019: CommentViewInput
    reviews2018: CommentViewInput
    reviews2019: CommentViewInput
    reviews: CommentViewInput
    tagDiscussionComments: CommentViewInput
    tagSubforumComments: CommentViewInput
    latestSubforumDiscussion: CommentViewInput
    moderatorComments: CommentViewInput
    debateResponses: CommentViewInput
    recentDebateResponses: CommentViewInput
    forumEventComments: CommentViewInput
    alignmentSuggestedComments: CommentViewInput
    rss: CommentViewInput
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
    comment(
      input: SingleCommentInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleCommentOutput
    comments(
      input: MultiCommentInput @deprecated(reason: "Use the selector field instead"),
      selector: CommentSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiCommentOutput
  }
`;
export const commentGqlQueryHandlers = getDefaultResolvers('Comments', CommentsViews);
export const commentGqlFieldResolvers = getFieldGqlResolvers('Comments', schema);
