import { mergeFeedQueries, defineFeedResolver, viewBasedSubquery, fixedIndexSubquery } from '../utils/feedUtil';
import Comments from '../../lib/collections/comments/collection';
import Posts from '../../lib/collections/posts/collection';
import { TagCommentType } from '../../lib/collections/comments/types';

defineFeedResolver<Date>({
  name: "SubforumDiscussionFeed",
  args: "tagId: String!",
  cutoffTypeGraphQL: "Date",
  resultTypesGraphQL: `
    subforumDiscussionThread: Comment
  `,
  resolver: async ({limit=20, cutoff, offset, args, context}: {
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
        viewBasedSubquery({
          type: "subforumDiscussionThread",
          collection: Comments,
          sortField: "lastSubthreadActivity",
          context,
          selector: {
            tagId: tagId,
            tagCommentType: TagCommentType.Subforum as string,
            parentCommentId: null,
          },
        }),
        viewBasedSubquery({
          type: "postCommented",
          collection: Posts,
          sortField: "lastCommentedAt",
          context,
          selector: {
            baseScore: {$gt:0},
            hideFrontpageComments: false,
            $or: [{isEvent: false}, {globalEvent: true}, {commentCount: {$nin:[0,null]}}],
            hiddenRelatedQuestion: undefined,
            shortform: undefined,
          },
        }),
        fixedIndexSubquery({
          type: "helloWorld",
          index: 5,
          result: {},
        })
      ],
    });
  }
});
