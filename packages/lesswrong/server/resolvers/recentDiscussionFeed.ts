import { mergeFeedQueries, defineFeedResolver, viewBasedSubquery, fixedIndexSubquery } from '../utils/feedUtil';
import { Posts } from '../../lib/collections/posts/collection';
import {
  EA_FORUM_COMMUNITY_TOPIC_ID,
  EA_FORUM_TRANSLATION_TOPIC_ID,
  Tags,
} from '../../lib/collections/tags/collection';
import { Revisions } from '../../lib/collections/revisions/collection';
import { isEAForum } from '../../lib/instanceSettings';
import { viewFieldAllowAny } from '../../lib/vulcan-lib/collections';

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

defineFeedResolver<Date>({
  name: "RecentDiscussionFeed",
  args: "af: Boolean",
  cutoffTypeGraphQL: "Date",
  resultTypesGraphQL: `
    postCommented: Post
    shortformCommented: Post
    tagDiscussed: Tag
    tagRevised: Revision
  `,
  resolver: async ({limit=20, cutoff, offset, args, context}: {
    limit?: number, cutoff?: Date, offset?: number,
    args: {af: boolean},
    context: ResolverContext
  }) => {
    type SortKeyType = Date;
    const {af} = args;
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

    const postSelector = {
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

    return await mergeFeedQueries<SortKeyType>({
      limit, cutoff, offset,
      subqueries: [
        // Post commented
        viewBasedSubquery({
          type: "postCommented",
          collection: Posts,
          sortField: "lastCommentedAt",
          context,
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
          selector: {
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
  }
});
