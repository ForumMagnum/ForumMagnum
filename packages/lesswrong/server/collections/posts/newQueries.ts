import schema from "@/lib/collections/posts/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { PostsViews } from "@/lib/collections/posts/views";

export const graphqlPostQueryTypeDefs = gql`
  type Post ${ getAllGraphQLFields(schema) }
  
  input SinglePostInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SinglePostOutput {
    result: Post
  }
  
  input PostViewInput {
    includeRelatedQuestions: String
    karmaThreshold: String
    meta: String
    userId: String
    filter: String
    filters: String
    filterSettings: String
    sortBy: String
    sortByMost: String
    sortedBy: String
    af: String
    excludeEvents: String
    onlineEvent: String
    globalEvent: String
    eventType: String
    groupId: String
    lat: String
    lng: String
    slug: String
    sortDraftsBy: String
    forum: String
    question: String
    tagId: String
    subforumTagId: String
    legacyId: String
    postId: String
    authorIsUnreviewed: String
    before: String
    after: String
    curatedAfter: String
    timeField: String
    postIds: String
    notPostIds: String
    reviewYear: String
    reviewPhase: String
    includeArchived: String
    includeDraftEvents: String
    includeShared: String
    hideCommunity: String
    distance: String
    audioOnly: String
    algoStartingAgeHours: String
    algoDecayFactorSlowest: String
    algoDecayFactorFastest: String
    algoActivityFactor: String
    algoActivityHalfLifeHours: String
    algoActivityWeight: String
    requiredUnnominated: String
    requiredFrontpage: String
   }
  
  input PostSelector  {
    default: PostViewInput
    userPosts: PostViewInput
    magic: PostViewInput
    top: PostViewInput
    new: PostViewInput
    recentComments: PostViewInput
    old: PostViewInput
    timeframe: PostViewInput
    daily: PostViewInput
    tagRelevance: PostViewInput
    frontpage: PostViewInput
    frontpageRss: PostViewInput
    curated: PostViewInput
    curatedRss: PostViewInput
    community: PostViewInput
    communityRss: PostViewInput
    metaRss: PostViewInput
    rss: PostViewInput
    topQuestions: PostViewInput
    recentQuestionActivity: PostViewInput
    scheduled: PostViewInput
    rejected: PostViewInput
    drafts: PostViewInput
    all_drafts: PostViewInput
    unlisted: PostViewInput
    userAFSubmissions: PostViewInput
    slugPost: PostViewInput
    legacyIdPost: PostViewInput
    recentDiscussionThreadsList: PostViewInput
    afRecentDiscussionThreadsList: PostViewInput
    reviewRecentDiscussionThreadsList2018: PostViewInput
    reviewRecentDiscussionThreadsList2019: PostViewInput
    globalEvents: PostViewInput
    nearbyEvents: PostViewInput
    events: PostViewInput
    eventsInTimeRange: PostViewInput
    upcomingEvents: PostViewInput
    pastEvents: PostViewInput
    tbdEvents: PostViewInput
    nonEventGroupPosts: PostViewInput
    postsWithBannedUsers: PostViewInput
    communityResourcePosts: PostViewInput
    sunshineNewPosts: PostViewInput
    sunshineNewUsersPosts: PostViewInput
    sunshineCuratedSuggestions: PostViewInput
    hasEverDialogued: PostViewInput
    pingbackPosts: PostViewInput
    nominations2018: PostViewInput
    nominations2019: PostViewInput
    reviews2018: PostViewInput
    reviews2019: PostViewInput
    voting2019: PostViewInput
    stickied: PostViewInput
    nominatablePostsByVote: PostViewInput
    reviewVoting: PostViewInput
    frontpageReviewWidget: PostViewInput
    reviewQuickPage: PostViewInput
    reviewFinalVoting: PostViewInput
    myBookmarkedPosts: PostViewInput
    alignmentSuggestedPosts: PostViewInput
    currentOpenThread: PostViewInput
  }
  
  input MultiPostInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiPostOutput {
    results: [Post]
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
export const postViewNameMap = {
      "frontpage-rss": "frontpageRss",
      "curated-rss": "curatedRss",
      "community-rss": "communityRss",
      "meta-rss": "metaRss",
      "2018reviewRecentDiscussionThreadsList": "reviewRecentDiscussionThreadsList2018",
      "2019reviewRecentDiscussionThreadsList": "reviewRecentDiscussionThreadsList2019"
    };
