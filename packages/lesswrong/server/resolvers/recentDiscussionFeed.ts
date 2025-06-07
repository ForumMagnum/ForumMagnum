import { mergeFeedQueries, viewBasedSubquery, fixedIndexSubquery } from '../utils/feedUtil';
import { Posts } from '../../server/collections/posts/collection';
import { Tags } from '../../server/collections/tags/collection';
import { Revisions } from '../../server/collections/revisions/collection';
import { isEAForum } from '../../lib/instanceSettings';
import { viewFieldAllowAny } from '@/lib/utils/viewConstants';
import { EA_FORUM_COMMUNITY_TOPIC_ID, EA_FORUM_TRANSLATION_TOPIC_ID } from '@/lib/collections/tags/helpers';
import gql from 'graphql-tag';

const communityFilters = {
  none: {$or: [
    {[`tagRelevance.${EA_FORUM_COMMUNITY_TOPIC_ID}`]: {$lt: 1}},
    {[`tagRelevance.${EA_FORUM_COMMUNITY_TOPIC_ID}`]: {$exists: false}},
  ]},
  lt10comments: {$or: [
    {[`tagRelevance.${EA_FORUM_COMMUNITY_TOPIC_ID}`]: {$lt: 1}},
    {[`tagRelevance.${EA_FORUM_COMMUNITY_TOPIC_ID}`]: {$exists: false}},
    {commentCount: {$lt: 10}},
  ]},
  all: {},
} as const;

type CommunityFilter = typeof communityFilters[keyof typeof communityFilters];

export const recentDiscussionFeedGraphQLTypeDefs = gql`
  type RecentDiscussionFeedQueryResults {
    cutoff: Date
    endOffset: Int!
    results: [RecentDiscussionFeedEntry!]
    sessionId: String
  }
  enum RecentDiscussionFeedEntryType {
    postCommented
    shortformCommented
    tagDiscussed
    tagRevised
    subscribeReminder
    meetupsPoke
  }
  type RecentDiscussionFeedEntry {
    type: RecentDiscussionFeedEntryType!
    postCommented: Post
    shortformCommented: Post
    tagDiscussed: Tag
    tagRevised: Revision
  }
  extend type Query {
    RecentDiscussionFeed(
      limit: Int,
      cutoff: Date,
      offset: Int,
      af: Boolean,
    ): RecentDiscussionFeedQueryResults!
  }
`

export const recentDiscussionFeedGraphQLQueries = {
  RecentDiscussionFeed: async (_root: void, args: any, context: ResolverContext) => {
    const {limit, cutoff, offset, af, sessionId, ...rest} = args;
    type SortKeyType = Date;
    const {currentUser} = context;

    const shouldSuggestMeetupSubscription = currentUser && !currentUser.nearbyEventsNotifications && !currentUser.hideMeetupsPoke; //TODO: Check some more fields

    const postCommentedEventsCriteria = {$or: [{isEvent: false}, {globalEvent: true}, {commentCount: {$gt: 0}}]}

    // On the EA Forum, we default to hiding posts tagged with "Community" from
    // Recent Discussion if they have at least 10 comments, or if the current user
    // has set `hideCommunitySection` to true
    let postCommentedExcludeCommunity: CommunityFilter = communityFilters.lt10comments;
    if (currentUser?.showCommunityInRecentDiscussion) {
      postCommentedExcludeCommunity = communityFilters.all;
    } else if (currentUser?.hideCommunitySection) {
      postCommentedExcludeCommunity = communityFilters.none;
    }

    const translationFilter = {$or: [
      {[`tagRelevance.${EA_FORUM_TRANSLATION_TOPIC_ID}`]: {$lt: 1}},
      {[`tagRelevance.${EA_FORUM_TRANSLATION_TOPIC_ID}`]: {$exists: false}},
    ]};

    const postSelector: MongoSelector<DbPost> = {
      baseScore: {$gt:0},
      hideFrontpageComments: false,
      lastCommentedAt: {$exists: true},
      hideFromRecentDiscussions: {$ne: true},
      hiddenRelatedQuestion: viewFieldAllowAny,
      groupId: viewFieldAllowAny,
      ...(af ? {af: true} : undefined),
      ...(isEAForum
        ? {$and: [
          postCommentedEventsCriteria,
          postCommentedExcludeCommunity,
          translationFilter,
        ]}
        : postCommentedEventsCriteria),
    };

    const result = await mergeFeedQueries<SortKeyType>({
      limit, cutoff, offset,
      subqueries: [
        // Post commented
        viewBasedSubquery({
          type: "postCommented",
          collection: Posts,
          sortField: "lastCommentedAt",
          context,
          includeDefaultSelector: false,
          selector: {
            ...postSelector,
            $or: [
              {shortform: {$exists: false}},
              {shortform: {$eq: false}},
            ],
          },
        }),
        // Shortform/quick take commented
        viewBasedSubquery({
          type: "shortformCommented",
          collection: Posts,
          sortField: "lastCommentedAt",
          context,
          includeDefaultSelector: false,
          selector: {
            ...postSelector,
            shortform: {$eq: true},
          },
        }),
        // Tags with discussion comments
        viewBasedSubquery({
          type: "tagDiscussed",
          collection: Tags,
          sortField: "lastCommentedAt",
          context,
          includeDefaultSelector: true,
          selector: {
            wikiOnly: viewFieldAllowAny,
            lastCommentedAt: {$exists: true},
            ...(af ? {af: true} : undefined),
          },
        }),
        // Large revision to tag
        viewBasedSubquery({
          type: "tagRevised",
          collection: Revisions,
          sortField: "editedAt",
          context,
          includeDefaultSelector: true,
          selector: {
            collectionName: "Tags",
            fieldName: "description",
            "changeMetrics.added": {$gt: 100},
            editedAt: {$exists: true},
          },
        }),
        // Suggestion to subscribe to curated
        fixedIndexSubquery({
          type: "subscribeReminder",
          index: isEAForum ? 3 : 6,
          result: {},
        }),
        // Suggestion to subscribe to meetups
        ...(shouldSuggestMeetupSubscription ?
          [fixedIndexSubquery({
            type: "meetupsPoke",
            index: 8,
            result: {},
          })]
          : []
        ),
      ],
    });
    
    return {
      __typename: "RecentDiscussionFeedQueryResults",
      ...result,
      sessionId
    }
  }
}
