import { mergeFeedQueries, defineFeedResolver, viewBasedSubquery, fixedIndexSubquery } from '../utils/feedUtil';
import { Posts } from '../../lib/collections/posts/collection';
import { Tags } from '../../lib/collections/tags/collection';
import { Revisions } from '../../lib/collections/revisions/collection';
import { forumTypeSetting } from '../../lib/instanceSettings';
import { filterModeIsSubscribed } from '../../lib/filterSettings';

defineFeedResolver<Date>({
  name: "RecentDiscussionFeed",
  args: "af: Boolean",
  cutoffTypeGraphQL: "Date",
  resultTypesGraphQL: `
    postCommented: Post
    tagDiscussed: Tag
    tagSubforumCommented: Tag
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
    
    const subforumTagIds = currentUser?.profileTagIds || [];
    // TODO possibly include subforums for tags that a user is subscribed to as below
    // const subforumTagIds = currentUser?.frontpageFilterSettings.tags.filter(tag => filterModeIsSubscribed(tag.filterMode)).map(tag => tag.tagId) || [];
    
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
            baseScore: {$gt:0},
            hideFrontpageComments: false,
            $or: [{isEvent: false}, {globalEvent: true}, {commentCount: {$gt: 0}}],
            lastCommentedAt: {$exists: true},
            hideFromRecentDiscussions: {$ne: true},
            hiddenRelatedQuestion: undefined,
            shortform: undefined,
            groupId: undefined,
            ...(af ? {af: true} : undefined),
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
        // Tags with subforum comments
        viewBasedSubquery({
          type: "tagSubforumCommented",
          collection: Tags,
          sortField: "lastSubforumCommentAt",
          context,
          selector: {
            _id: {$in: subforumTagIds},
            lastSubforumCommentAt: {$exists: true},
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
