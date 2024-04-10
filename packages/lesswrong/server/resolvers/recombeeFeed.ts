
import { mergeFeedQueries, defineFeedResolver, viewBasedSubquery, fixedIndexSubquery, directRecommendationsSubquery } from '../utils/feedUtil';
import { Posts } from '../../lib/collections/posts/collection';
import { viewFieldAllowAny } from '../vulcan-lib';
import { HybridRecombeeConfiguration } from '../../lib/collections/users/recommendationSettings';

defineFeedResolver<Date>({
  name: "RecombeeFeed",
  args: "settings: JSON",
  cutoffTypeGraphQL: "String",
  resultTypesGraphQL: `
    postCommented: Post
    recommendation: Post
    shortformCommented: Post
    tagDiscussed: Tag
    tagRevised: Revision
  `,
  resolver: async ({limit=20, cutoff, offset, args, context}: {
    limit?: number, cutoff?: Date, offset?: number,
    args: {settings: HybridRecombeeConfiguration},
    context: ResolverContext
  }) => {
    type SortKeyType = Date;
    const { settings } = args;
    const {currentUser} = context;

    const postSelector = {
      baseScore: {$gt:0},
      hideFrontpageComments: false,
      lastCommentedAt: {$exists: true},
      hideFromRecentDiscussions: {$ne: true},
      hiddenRelatedQuestion: viewFieldAllowAny,
    };

    return await mergeFeedQueries<SortKeyType>({
      limit, cutoff, offset,
      subqueries: [
        // Recombee post recommendations
        directRecommendationsSubquery({
          // TODO: don't use bang
          userId: currentUser!._id,
          settings,
          context
        }),

        // // Post commented
        // viewBasedSubquery({
        //   type: "postCommented",
        //   collection: Posts,
        //   sortField: "lastCommentedAt",
        //   context,
        //   selector: {
        //     ...postSelector,
        //     $or: [
        //       {shortform: {$exists: false}},
        //       {shortform: {$eq: false}},
        //     ],
        //   },
        // }),
        // // Shortform/quick take commented
        // viewBasedSubquery({
        //   type: "shortformCommented",
        //   collection: Posts,
        //   sortField: "lastCommentedAt",
        //   context,
        //   selector: {
        //     ...postSelector,
        //     shortform: {$eq: true},
        //   },
        // }),
        // // Tags with discussion comments
        // viewBasedSubquery({
        //   type: "tagDiscussed",
        //   collection: Tags,
        //   sortField: "lastCommentedAt",
        //   context,
        //   selector: {
        //     lastCommentedAt: {$exists: true},
        //     ...(af ? {af: true} : undefined),
        //   },
        // }),
        // // Large revision to tag
        // viewBasedSubquery({
        //   type: "tagRevised",
        //   collection: Revisions,
        //   sortField: "editedAt",
        //   context,
        //   selector: {
        //     collectionName: "Tags",
        //     fieldName: "description",
        //     "changeMetrics.added": {$gt: 100},
        //     editedAt: {$exists: true},
        //   },
        // }),
        // // Suggestion to subscribe to curated
        // fixedIndexSubquery({
        //   type: "subscribeReminder",
        //   index: isEAForum ? 3 : 6,
        //   result: {},
        // }),
        // // Suggestion to subscribe to meetups
        // ...(shouldSuggestMeetupSubscription ?
        //   [fixedIndexSubquery({
        //     type: "meetupsPoke",
        //     index: 8,
        //     result: {},
        //   })]
        //   : []
        // ),
      ],
    });
  }
});
