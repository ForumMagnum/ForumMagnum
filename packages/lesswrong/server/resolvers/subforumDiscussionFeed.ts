import { mergeFeedQueries, defineFeedResolver, viewBasedSubquery, fixedIndexSubquery } from '../utils/feedUtil';
import Comments from '../../lib/collections/comments/collection';
import Posts from '../../lib/collections/posts/collection';
import { TagCommentType } from '../../lib/collections/comments/types';

defineFeedResolver<Date>({
  name: "SubforumDiscussionFeed",
  args: `tagId: String!`,
  cutoffTypeGraphQL: "Date",
  resultTypesGraphQL: `
    subforumDiscussionThread: Comment
    postCommented: Post
  `,
  resolver: async ({limit=4, cutoff, offset, args, context}: {
    limit?: number, cutoff?: Date, offset?: number,
    args: {tagId: string},
    context: ResolverContext,
  }) => {
    type SortKeyType = Date;
    const {tagId} = args;
    
    return await mergeFeedQueries<SortKeyType>({
      limit, cutoff, offset,
      subqueries: [
        // Subforum thread commented
        // viewBasedSubquery({
        //   type: "subforumDiscussionThread",
        //   collection: Comments,
        //   sortField: "lastSubthreadActivity",
        //   context,
        //   selector: {
        //     tagId: tagId,
        //     tagCommentType: TagCommentType.Subforum as string,
        //     parentCommentId: null,
        //   },
        // }),
        viewBasedSubquery({
          type: "postCommented",
          collection: Posts,
          sortField: "lastCommentedAt",
          context,
          selector: {
            isEvent: false,
            groupId: undefined,
            [`tagRelevance.${tagId}`]: {$gt: 0},
          },
        }),
      ],
    });
  }
});
