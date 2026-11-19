import gql from 'graphql-tag';
import { mergeFeedQueries, viewBasedSubquery } from '../utils/feedUtil';
import { Posts } from '../collections/posts/collection';
import { Comments } from '../collections/comments/collection';
import { PostsViews } from '@/lib/collections/posts/views';
import { mergeWithDefaultViewSelector } from '@/lib/utils/viewUtils';

export const tagContentFeedGraphQLTypeDefs = gql`
  type TagContentFeedQueryResults {
    cutoff: Date
    endOffset: Int!
    results: [TagContentFeedEntry!]
  }
  enum TagContentFeedEntryType {
    tagPost
    tagComment
  }
  enum TagContentFeedSortBy {
    magic
    new
    top
  }
  type TagContentFeedEntry {
    type: TagContentFeedEntryType!
    tagPost: Post
    tagComment: Comment
  }
  extend type Query {
    TagContentFeed(
      tagId: String!
      sortBy: TagContentFeedSortBy!
      limit: Int
      cutoff: Date
      offset: Int
    ): TagContentFeedQueryResults!
  }
`;

const sortFields = {
  magic: "score",
  new: "postedAt",
  top: "baseScore",
} as const;

function taggedPostsSelector(tagId: string) {
  return { [`tagRelevance.${tagId}`]: { $gte: 1 } };
}

async function getTaggedPostIds(tagId: string, context: ResolverContext) {
  const selector = await mergeWithDefaultViewSelector(PostsViews, taggedPostsSelector(tagId), context);
  const posts = await Posts.find(selector, {}, { _id: 1 }).fetch();
  return posts.map(post => post._id);
}

export const tagContentFeedGraphQLQueries = {
  TagContentFeed: async (_root: void, args: { tagId: string; sortBy: keyof typeof sortFields; limit?: number; offset?: number }, context: ResolverContext) => {
    const { tagId, sortBy, limit = 20, offset = 0 } = args;
    const sortField = sortFields[sortBy];
    const taggedPostIds = await getTaggedPostIds(tagId, context);

    // Paginate by offset rather than by cutoff: baseScore ties are common, and
    // a cutoff of `baseScore < x` would skip every tied item past a page boundary.
    // The returned cutoff only tells MixedTypeFeed whether there are more pages.
    const { results } = await mergeFeedQueries({
      limit: offset + limit,
      sortDirection: "desc",
      subqueries: [
        viewBasedSubquery({
          type: "tagPost",
          collection: Posts,
          sortField,
          context,
          includeDefaultSelector: true,
          selector: taggedPostsSelector(tagId),
        }),
        viewBasedSubquery({
          type: "tagComment",
          collection: Comments,
          sortField,
          context,
          includeDefaultSelector: true,
          selector: {
            deleted: false,
            $or: [
              { postId: { $in: taggedPostIds } },
              { shortform: true, parentCommentId: null, relevantTagIds: tagId },
            ],
          },
        }),
      ],
    });
    const page = results.slice(offset);

    return {
      __typename: "TagContentFeedQueryResults",
      results: page,
      endOffset: offset + page.length,
      cutoff: page.length < limit ? null : new Date(),
    };
  },
};
