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
  
  input CommentDefaultViewInput {
    userId: String
    commentIds: String
    minimumKarma: String
  }
  
  input CommentsCommentRepliesInput {
    userId: String
    commentIds: String
    minimumKarma: String
    parentCommentId: String
  }
  
  input CommentsPostCommentsDeletedInput {
    userId: String
    commentIds: String
    minimumKarma: String
    postId: String
  }
  
  input CommentsAllCommentsDeletedInput {
    userId: String
    commentIds: String
    minimumKarma: String
  }
  
  input CommentsCheckedByModGPTInput {
    userId: String
    commentIds: String
    minimumKarma: String
  }
  
  input CommentsPostCommentsTopInput {
    userId: String
    commentIds: String
    minimumKarma: String
    postId: String
  }
  
  input CommentsPostCommentsRecentRepliesInput {
    userId: String
    commentIds: String
    minimumKarma: String
    postId: String
  }
  
  input CommentsPostCommentsMagicInput {
    userId: String
    commentIds: String
    minimumKarma: String
    postId: String
  }
  
  input CommentsAfPostCommentsTopInput {
    userId: String
    commentIds: String
    minimumKarma: String
    postId: String
  }
  
  input CommentsPostCommentsOldInput {
    userId: String
    commentIds: String
    minimumKarma: String
    postId: String
  }
  
  input CommentsPostCommentsNewInput {
    userId: String
    commentIds: String
    minimumKarma: String
    postId: String
  }
  
  input CommentsPostCommentsBestInput {
    userId: String
    commentIds: String
    minimumKarma: String
    postId: String
  }
  
  input CommentsPostLWCommentsInput {
    userId: String
    commentIds: String
    minimumKarma: String
    postId: String
  }
  
  input CommentsProfileRecentCommentsInput {
    userId: String
    commentIds: String
    minimumKarma: String
    limit: String
  }
  
  input CommentsProfileCommentsInput {
    userId: String
    commentIds: String
    minimumKarma: String
    sortBy: String
    limit: String
  }
  
  input CommentsAllRecentCommentsInput {
    userId: String
    commentIds: String
    minimumKarma: String
    sortBy: String
    limit: String
  }
  
  input CommentsRecentCommentsInput {
    userId: String
    commentIds: String
    minimumKarma: String
    sortBy: String
    limit: String
  }
  
  input CommentsAfSubmissionsInput {
    userId: String
    commentIds: String
    minimumKarma: String
    limit: String
  }
  
  input CommentsRejectedInput {
    userId: String
    commentIds: String
    minimumKarma: String
    limit: String
  }
  
  input CommentsRecentDiscussionThreadInput {
    userId: String
    commentIds: String
    minimumKarma: String
    postId: String
    limit: String
  }
  
  input CommentsAfRecentDiscussionThreadInput {
    userId: String
    commentIds: String
    minimumKarma: String
    postId: String
    limit: String
  }
  
  input CommentsPostsItemCommentsInput {
    userId: String
    commentIds: String
    minimumKarma: String
    postId: String
    after: String
    limit: String
  }
  
  input CommentsSunshineNewCommentsListInput {
    userId: String
    commentIds: String
    minimumKarma: String
    limit: String
  }
  
  input CommentsQuestionAnswersInput {
    userId: String
    commentIds: String
    minimumKarma: String
    postId: String
    sortBy: String
  }
  
  input CommentsLegacyIdCommentInput {
    userId: String
    commentIds: String
    minimumKarma: String
    legacyId: String
  }
  
  input CommentsSunshineNewUsersCommentsInput {
    userId: String
    commentIds: String
    minimumKarma: String
  }
  
  input CommentsDefaultModeratorResponsesInput {
    userId: String
    commentIds: String
    minimumKarma: String
    tagId: String
  }
  
  input CommentsRepliesToAnswerInput {
    userId: String
    commentIds: String
    minimumKarma: String
    parentAnswerId: String
  }
  
  input CommentsAnswersAndRepliesInput {
    userId: String
    commentIds: String
    minimumKarma: String
    postId: String
    sortBy: String
  }
  
  input CommentsTopShortformInput {
    userId: String
    commentIds: String
    minimumKarma: String
    before: String
    after: String
    shortformFrontpage: String
  }
  
  input CommentsShortformInput {
    userId: String
    commentIds: String
    minimumKarma: String
  }
  
  input CommentsShortformFrontpageInput {
    userId: String
    commentIds: String
    minimumKarma: String
    maxAgeDays: String
    showCommunity: String
    relevantTagId: String
  }
  
  input CommentsRepliesToCommentThreadInput {
    userId: String
    commentIds: String
    minimumKarma: String
    topLevelCommentId: String
  }
  
  input CommentsShortformLatestChildrenInput {
    userId: String
    commentIds: String
    minimumKarma: String
    topLevelCommentId: String
  }
  
  input CommentsNominations2018Input {
    userId: String
    commentIds: String
    minimumKarma: String
  }
  
  input CommentsNominations2019Input {
    userId: String
    commentIds: String
    minimumKarma: String
  }
  
  input CommentsReviews2018Input {
    userId: String
    commentIds: String
    minimumKarma: String
  }
  
  input CommentsReviews2019Input {
    userId: String
    commentIds: String
    minimumKarma: String
  }
  
  input CommentsReviewsInput {
    userId: String
    commentIds: String
    minimumKarma: String
  }
  
  input CommentsTagDiscussionCommentsInput {
    userId: String
    commentIds: String
    minimumKarma: String
    tagId: String
  }
  
  input CommentsTagSubforumCommentsInput {
    userId: String
    commentIds: String
    minimumKarma: String
  }
  
  input CommentsLatestSubforumDiscussionInput {
    userId: String
    commentIds: String
    minimumKarma: String
    profileTagIds: String
  }
  
  input CommentsModeratorCommentsInput {
    userId: String
    commentIds: String
    minimumKarma: String
  }
  
  input CommentsDebateResponsesInput {
    userId: String
    commentIds: String
    minimumKarma: String
    postId: String
  }
  
  input CommentsRecentDebateResponsesInput {
    userId: String
    commentIds: String
    minimumKarma: String
    postId: String
    limit: String
  }
  
  input CommentsForumEventCommentsInput {
    userId: String
    commentIds: String
    minimumKarma: String
    forumEventId: String
  }
  
  input CommentsAlignmentSuggestedCommentsInput {
    userId: String
    commentIds: String
    minimumKarma: String
    postId: String
  }
  
  input CommentsRssInput {
    userId: String
    commentIds: String
    minimumKarma: String
  }
  
  input CommentSelector  {
    default: CommentDefaultViewInput
    commentReplies: CommentsCommentRepliesInput
    postCommentsDeleted: CommentsPostCommentsDeletedInput
    allCommentsDeleted: CommentsAllCommentsDeletedInput
    checkedByModGPT: CommentsCheckedByModGPTInput
    postCommentsTop: CommentsPostCommentsTopInput
    postCommentsRecentReplies: CommentsPostCommentsRecentRepliesInput
    postCommentsMagic: CommentsPostCommentsMagicInput
    afPostCommentsTop: CommentsAfPostCommentsTopInput
    postCommentsOld: CommentsPostCommentsOldInput
    postCommentsNew: CommentsPostCommentsNewInput
    postCommentsBest: CommentsPostCommentsBestInput
    postLWComments: CommentsPostLWCommentsInput
    profileRecentComments: CommentsProfileRecentCommentsInput
    profileComments: CommentsProfileCommentsInput
    allRecentComments: CommentsAllRecentCommentsInput
    recentComments: CommentsRecentCommentsInput
    afSubmissions: CommentsAfSubmissionsInput
    rejected: CommentsRejectedInput
    recentDiscussionThread: CommentsRecentDiscussionThreadInput
    afRecentDiscussionThread: CommentsAfRecentDiscussionThreadInput
    postsItemComments: CommentsPostsItemCommentsInput
    sunshineNewCommentsList: CommentsSunshineNewCommentsListInput
    questionAnswers: CommentsQuestionAnswersInput
    legacyIdComment: CommentsLegacyIdCommentInput
    sunshineNewUsersComments: CommentsSunshineNewUsersCommentsInput
    defaultModeratorResponses: CommentsDefaultModeratorResponsesInput
    repliesToAnswer: CommentsRepliesToAnswerInput
    answersAndReplies: CommentsAnswersAndRepliesInput
    topShortform: CommentsTopShortformInput
    shortform: CommentsShortformInput
    shortformFrontpage: CommentsShortformFrontpageInput
    repliesToCommentThread: CommentsRepliesToCommentThreadInput
    shortformLatestChildren: CommentsShortformLatestChildrenInput
    nominations2018: CommentsNominations2018Input
    nominations2019: CommentsNominations2019Input
    reviews2018: CommentsReviews2018Input
    reviews2019: CommentsReviews2019Input
    reviews: CommentsReviewsInput
    tagDiscussionComments: CommentsTagDiscussionCommentsInput
    tagSubforumComments: CommentsTagSubforumCommentsInput
    latestSubforumDiscussion: CommentsLatestSubforumDiscussionInput
    moderatorComments: CommentsModeratorCommentsInput
    debateResponses: CommentsDebateResponsesInput
    recentDebateResponses: CommentsRecentDebateResponsesInput
    forumEventComments: CommentsForumEventCommentsInput
    alignmentSuggestedComments: CommentsAlignmentSuggestedCommentsInput
    rss: CommentsRssInput
  }
  
  input MultiCommentInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
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
