import Comments from '../../lib/collections/comments/collection';
import { defineFeedResolver, mergeFeedQueries, viewBasedSubquery } from '../utils/feedUtil';

defineFeedResolver<Date>({
  name: "RecentCommentsFeed",
  args: "userIds: [String], af: Boolean",
  cutoffTypeGraphQL: "Date",
  resultTypesGraphQL: `
    recentComment: Comment
  `,
  resolver: async ({limit=20, cutoff, offset, args, context}: {
    limit?: number, cutoff?: Date, offset?: number,
    args: {userIds: string[], af: boolean},
    context: ResolverContext
  }) => {
    type SortKeyType = Date;
    const {userIds, af} = args;
    
    return await mergeFeedQueries<SortKeyType>({
      limit, cutoff, offset,
      subqueries: [
        // Recent comments
        viewBasedSubquery({
          type: "recentComment",
          collection: Comments,
          sortField: "postedAt",
          context,
          selector: {
            ...(userIds.length ? { userId: { $in: userIds } } : undefined),
            ...(af ? {af: true} : undefined),
          },
        }),
      ],
    });
  }
});
