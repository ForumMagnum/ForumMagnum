import { mergeFeedQueries, defineFeedResolver, viewBasedSubquery, fixedIndexSubquery } from '../utils/feedUtil';
import { Posts } from '../../lib/collections/posts/collection';
import { EA_FORUM_COMMUNITY_TOPIC_ID, Tags } from '../../lib/collections/tags/collection';
import { Revisions } from '../../lib/collections/revisions/collection';
import { forumTypeSetting, isEAForum } from '../../lib/instanceSettings';
import { filterModeIsSubscribed } from '../../lib/filterSettings';
import Comments from '../../lib/collections/comments/collection';
import { viewFieldAllowAny } from '../vulcan-lib';

defineFeedResolver<number>({
  name: "RecommendationsFeed",
  args: "af: Boolean",
  cutoffTypeGraphQL: "Float",
  resultTypesGraphQL: `
    postCommented: Post
    tagDiscussed: Tag
    tagSubforumComments: Comment
    tagRevised: Revision
  `,
  resolver: async ({limit=20, cutoff, offset, args, context}: {
    limit?: number, cutoff?: number, offset?: number,
    args: {af: boolean},
    context: ResolverContext
  }) => {
    type SortKeyType = number;
    const {af} = args;
    const {currentUser} = context;
    
    const shouldSuggestMeetupSubscription = currentUser && !currentUser.nearbyEventsNotifications && !currentUser.hideMeetupsPoke; //TODO: Check some more fields
    
    const subforumTagIds = currentUser?.profileTagIds || [];
    // TODO possibly include subforums for tags that a user is subscribed to as below
    // const subforumTagIds = currentUser?.frontpageFilterSettings.tags.filter(tag => filterModeIsSubscribed(tag.filterMode)).map(tag => tag.tagId) || [];
    
    const postCommentedEventsCriteria = {$or: [{isEvent: false}, {globalEvent: true}, {commentCount: {$gt: 0}}]}
    // On the EA Forum, we default to hiding posts tagged with "Community" from Recent Discussion
    const postCommentedExcludeCommunity = {$or: [
      {[`tagRelevance.${EA_FORUM_COMMUNITY_TOPIC_ID}`]: {$lt: 1}},
      {[`tagRelevance.${EA_FORUM_COMMUNITY_TOPIC_ID}`]: {$exists: false}},
    ]}
    
    return await mergeFeedQueries<SortKeyType>({
      limit, cutoff, offset,
      subqueries: [
        // Post commented
        viewBasedSubquery({
          type: "postCommented",
          collection: Posts,
          sortField: "score",
          context,
          selector: {
            baseScore: {$gt:0},
            hideFrontpageComments: false,
            lastCommentedAt: {$exists: true},
            hideFromRecentDiscussions: {$ne: true},
            hiddenRelatedQuestion: viewFieldAllowAny,
            shortform: viewFieldAllowAny,
            groupId: viewFieldAllowAny,
            ...(af ? {af: true} : undefined),
            ...((isEAForum && !currentUser?.showCommunityInRecentDiscussion) ? {$and: [
              postCommentedEventsCriteria,
              postCommentedExcludeCommunity
            ]} : postCommentedEventsCriteria)
          },
        }),
        // Suggestion to subscribe to curated
        fixedIndexSubquery({
          type: "subscribeReminder",
          index: forumTypeSetting.get() === 'EAForum' ? 3 : 6,
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
