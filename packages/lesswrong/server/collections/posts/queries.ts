import schema from "@/lib/collections/posts/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { PostsViews } from "@/lib/collections/posts/views";

export const graphqlPostQueryTypeDefs = gql`
  type Post ${ getAllGraphQLFields(schema) }

  enum PostCategory {
    post
    linkpost
    question
  }
  
  input SinglePostInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SinglePostOutput {
    result: Post
  }
  
  input PostDefaultViewInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
  }
  
  input PostsUserPostsInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
  }
  
  input PostsMagicInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
    meta: Boolean
    forum: Boolean
  }
  
  input PostsTopInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
    meta: Boolean
    forum: Boolean
  }
  
  input PostsNewInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
    meta: Boolean
    forum: Boolean
  }
  
  input PostsRecentCommentsInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
  }
  
  input PostsOldInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
  }
  
  input PostsTimeframeInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
    limit: String
  }
  
  input PostsDailyInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
  }
  
  input PostsTagRelevanceInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
  }
  
  input PostsFrontpageInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
  }
  
  input PostsFrontpageRssInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
  }
  
  input PostsCuratedInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
  }
  
  input PostsCuratedRssInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
  }
  
  input PostsCommunityInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
  }
  
  input PostsCommunityRssInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
  }
  
  input PostsMetaRssInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
  }
  
  input PostsRssInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
    meta: Boolean
    forum: Boolean
  }
  
  input PostsTopQuestionsInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
  }
  
  input PostsRecentQuestionActivityInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
  }
  
  input PostsScheduledInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
  }
  
  input PostsRejectedInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
  }
  
  input PostsDraftsInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
    includeDraftEvents: Boolean
    includeArchived: Boolean
    includeShared: Boolean
    sortDraftsBy: String
  }
  
  input PostsAll_draftsInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
  }
  
  input PostsUnlistedInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
  }
  
  input PostsUserAFSubmissionsInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
  }
  
  input PostsSlugPostInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
    slug: String
  }
  
  input PostsLegacyIdPostInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
    legacyId: String
  }
  
  input PostsRecentDiscussionThreadsListInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
    limit: String
  }
  
  input PostsAfRecentDiscussionThreadsListInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
    limit: String
  }
  
  input PostsReviewRecentDiscussionThreadsList2018Input {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
    limit: String
  }
  
  input PostsReviewRecentDiscussionThreadsList2019Input {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
    limit: String
  }
  
  input PostsGlobalEventsInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
    onlineEvent: Boolean
    eventType: [String!]
  }
  
  input PostsNearbyEventsInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
    onlineEvent: Boolean
    eventType: [String!]
    lng: Float
    lat: Float
    distance: Float
    filters: [String!]
  }
  
  input PostsEventsInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
    globalEvent: Boolean
    onlineEvent: Boolean
  }
  
  input PostsEventsInTimeRangeInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
  }
  
  input PostsUpcomingEventsInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
  }
  
  input PostsPastEventsInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
  }
  
  input PostsTbdEventsInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
  }
  
  input PostsNonEventGroupPostsInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
  }
  
  input PostsPostsWithBannedUsersInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
  }
  
  input PostsCommunityResourcePostsInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
  }
  
  input PostsSunshineNewPostsInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
  }
  
  input PostsSunshineNewUsersPostsInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
  }
  
  input PostsSunshineCuratedSuggestionsInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
    audioOnly: Boolean
  }
  
  input PostsHasEverDialoguedInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
  }
  
  input PostsPingbackPostsInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
    postId: String
  }
  
  input PostsNominations2018Input {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
    sortByMost: Boolean
  }
  
  input PostsNominations2019Input {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
    sortByMost: Boolean
  }
  
  input PostsReviews2018Input {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
    sortBy: String
  }
  
  input PostsReviews2019Input {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
    sortBy: String
  }
  
  input PostsVoting2019Input {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
    sortBy: String
  }
  
  input PostsStickiedInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
  }
  
  input PostsNominatablePostsByVoteInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
    requiredUnnominated: Boolean
    requiredFrontpage: Boolean
  }
  
  input PostsReviewVotingInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
    reviewPhase: String
  }
  
  input PostsFrontpageReviewWidgetInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
    reviewYear: Int
    reviewPhase: String
  }
  
  input PostsReviewQuickPageInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
  }
  
  input PostsReviewFinalVotingInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
  }
  
  input PostsMyBookmarkedPostsInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
    limit: String
  }
  
  input PostsAlignmentSuggestedPostsInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
  }
  
  input PostsCurrentOpenThreadInput {
    postIds: [String!]
    notPostIds: [String!]
    groupId: String
    af: Boolean
    question: Boolean
    authorIsUnreviewed: Boolean
    exactPostIds: [String!]
    hideCommunity: Boolean
    karmaThreshold: Int
    excludeEvents: Boolean
    userId: String
    includeRelatedQuestions: String
    filter: String
    view: String
    filterSettings: JSON
    sortedBy: String
    after: String
    before: String
    timeField: String
    curatedAfter: String
  }
  
  input PostSelector  {
    default: PostDefaultViewInput
    userPosts: PostsUserPostsInput
    magic: PostsMagicInput
    top: PostsTopInput
    new: PostsNewInput
    recentComments: PostsRecentCommentsInput
    old: PostsOldInput
    timeframe: PostsTimeframeInput
    daily: PostsDailyInput
    tagRelevance: PostsTagRelevanceInput
    frontpage: PostsFrontpageInput
    frontpageRss: PostsFrontpageRssInput
    curated: PostsCuratedInput
    curatedRss: PostsCuratedRssInput
    community: PostsCommunityInput
    communityRss: PostsCommunityRssInput
    metaRss: PostsMetaRssInput
    rss: PostsRssInput
    topQuestions: PostsTopQuestionsInput
    recentQuestionActivity: PostsRecentQuestionActivityInput
    scheduled: PostsScheduledInput
    rejected: PostsRejectedInput
    drafts: PostsDraftsInput
    all_drafts: PostsAll_draftsInput
    unlisted: PostsUnlistedInput
    userAFSubmissions: PostsUserAFSubmissionsInput
    slugPost: PostsSlugPostInput
    legacyIdPost: PostsLegacyIdPostInput
    recentDiscussionThreadsList: PostsRecentDiscussionThreadsListInput
    afRecentDiscussionThreadsList: PostsAfRecentDiscussionThreadsListInput
    reviewRecentDiscussionThreadsList2018: PostsReviewRecentDiscussionThreadsList2018Input
    reviewRecentDiscussionThreadsList2019: PostsReviewRecentDiscussionThreadsList2019Input
    globalEvents: PostsGlobalEventsInput
    nearbyEvents: PostsNearbyEventsInput
    events: PostsEventsInput
    eventsInTimeRange: PostsEventsInTimeRangeInput
    upcomingEvents: PostsUpcomingEventsInput
    pastEvents: PostsPastEventsInput
    tbdEvents: PostsTbdEventsInput
    nonEventGroupPosts: PostsNonEventGroupPostsInput
    postsWithBannedUsers: PostsPostsWithBannedUsersInput
    communityResourcePosts: PostsCommunityResourcePostsInput
    sunshineNewPosts: PostsSunshineNewPostsInput
    sunshineNewUsersPosts: PostsSunshineNewUsersPostsInput
    sunshineCuratedSuggestions: PostsSunshineCuratedSuggestionsInput
    hasEverDialogued: PostsHasEverDialoguedInput
    pingbackPosts: PostsPingbackPostsInput
    nominations2018: PostsNominations2018Input
    nominations2019: PostsNominations2019Input
    reviews2018: PostsReviews2018Input
    reviews2019: PostsReviews2019Input
    voting2019: PostsVoting2019Input
    stickied: PostsStickiedInput
    nominatablePostsByVote: PostsNominatablePostsByVoteInput
    reviewVoting: PostsReviewVotingInput
    frontpageReviewWidget: PostsFrontpageReviewWidgetInput
    reviewQuickPage: PostsReviewQuickPageInput
    reviewFinalVoting: PostsReviewFinalVotingInput
    myBookmarkedPosts: PostsMyBookmarkedPostsInput
    alignmentSuggestedPosts: PostsAlignmentSuggestedPostsInput
    currentOpenThread: PostsCurrentOpenThreadInput
  }
  
  input MultiPostInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiPostOutput {
    results: [Post!]!
    totalCount: Int
  }
  
  extend type Query {
    post(
      input: SinglePostInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SinglePostOutput
    posts(
      input: MultiPostInput @deprecated(reason: "Use the selector field instead"),
      selector: PostSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiPostOutput
  }
`;
export const postGqlQueryHandlers = getDefaultResolvers('Posts', PostsViews);
export const postGqlFieldResolvers = getFieldGqlResolvers('Posts', schema);
