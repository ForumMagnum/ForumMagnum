import schema from "@/lib/collections/comments/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { CommentsViews } from "@/lib/collections/comments/views";

export const graphqlCommentQueryTypeDefs = gql`
  type Comment ${ getAllGraphQLFields(schema) }

  enum TagCommentType {
    SUBFORUM
    DISCUSSION
  }

  enum CommentSortingMode {
    top
    groupByPost
    new
    newest
    old
    oldest
    magic
    recentComments
    recentDiscussion
  }
  
  input SingleCommentInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }
  
  type SingleCommentOutput {
    result: Comment
  }
  
  input CommentDefaultViewInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
  }
  
  input CommentsCommentRepliesInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
    parentCommentId: String
  }
  
  input CommentsPostCommentsDeletedInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
    postId: String
  }
  
  input CommentsAllCommentsDeletedInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
  }
  
  input CommentsCheckedByModGPTInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
  }
  
  input CommentsPostCommentsTopInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
    postId: String
  }
  
  input CommentsPostCommentsRecentRepliesInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
    postId: String
  }
  
  input CommentsPostCommentsMagicInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
    postId: String
  }
  
  input CommentsAfPostCommentsTopInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
    postId: String
  }
  
  input CommentsPostCommentsOldInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
    postId: String
  }
  
  input CommentsPostCommentsNewInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
    postId: String
  }
  
  input CommentsPostCommentsBestInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
    postId: String
  }
  
  input CommentsPostLWCommentsInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
    postId: String
  }
  
  input CommentsProfileRecentCommentsInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
    limit: String
  }
  
  input CommentsProfileCommentsInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
    sortBy: String
    drafts: String
    limit: String
  }
  
  input CommentsAllRecentCommentsInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
    sortBy: String
    limit: String
  }
  
  input CommentsRecentCommentsInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
    sortBy: String
    limit: String
  }
  
  input CommentsAfSubmissionsInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
    limit: String
  }
  
  input CommentsRejectedInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
    limit: String
  }
  
  input CommentsRecentDiscussionThreadInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
    postId: String
    limit: String
  }
  
  input CommentsAfRecentDiscussionThreadInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
    postId: String
    limit: String
  }
  
  input CommentsPostsItemCommentsInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
    postId: String
    after: String
    limit: String
  }
  
  input CommentsSunshineNewCommentsListInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
    limit: String
  }
  
  input CommentsQuestionAnswersInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
    postId: String
    sortBy: String
  }
  
  input CommentsLegacyIdCommentInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
    legacyId: String
  }
  
  input CommentsSunshineNewUsersCommentsInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
  }
  
  input CommentsDefaultModeratorResponsesInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
    tagId: String
  }
  
  input CommentsRepliesToAnswerInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
    parentAnswerId: String
  }
  
  input CommentsAnswersAndRepliesInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
    postId: String
    sortBy: String
  }
  
  input CommentsTopShortformInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
    before: String
    after: String
    shortformFrontpage: Boolean
  }
  
  input CommentsShortformInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
  }
  
  input CommentsShortformFrontpageInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
    maxAgeDays: Int
    showCommunity: Boolean
    relevantTagId: String
  }
  
  input CommentsRepliesToCommentThreadInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
    topLevelCommentId: String
  }
  
  input CommentsRepliesToCommentThreadIncludingRootInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
    topLevelCommentId: String!
  }

  input CommentsShortformLatestChildrenInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
    topLevelCommentId: String
  }
  
  input CommentsNominations2018Input {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
    postId: String
    sortBy: CommentSortingMode
  }
  
  input CommentsNominations2019Input {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
    postId: String
    sortBy: CommentSortingMode
  }
  
  input CommentsReviews2018Input {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
    postId: String
    sortBy: CommentSortingMode
  }
  
  input CommentsReviews2019Input {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
    postId: String
    sortBy: CommentSortingMode
  }
  
  input CommentsReviewsInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
    postId: String
    reviewYear: Int
    sortBy: String
  }
  
  input CommentsTagDiscussionCommentsInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
    tagId: String
  }
  
  input CommentsTagSubforumCommentsInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
  }
  
  input CommentsLatestSubforumDiscussionInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
    profileTagIds: String
  }
  
  input CommentsModeratorCommentsInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
  }
  
  input CommentsDebateResponsesInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
    postId: String
  }
  
  input CommentsRecentDebateResponsesInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
    postId: String
    limit: String
  }
  
  input CommentsForumEventCommentsInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
    forumEventId: String
  }
  
  input CommentsAlignmentSuggestedCommentsInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
    postId: String
  }
  
  input CommentsRssInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
  }

  input CommentsDraftCommentsInput {
    userId: String
    commentIds: [String!]
    minimumKarma: Int
    authorIsUnreviewed: Boolean
    postId: String
    drafts: String
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
    repliesToCommentThreadIncludingRoot: CommentsRepliesToCommentThreadIncludingRootInput
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
    draftComments: CommentsDraftCommentsInput
  }
  
  input MultiCommentInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiCommentOutput {
    results: [Comment!]!
    totalCount: Int
  }
  
  extend type Query {
    comment(
      input: SingleCommentInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput,
      allowNull: Boolean
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
