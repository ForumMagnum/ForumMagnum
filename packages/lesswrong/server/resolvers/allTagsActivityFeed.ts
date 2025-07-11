import { mergeFeedQueries, viewBasedSubquery } from '../utils/feedUtil';
import { Comments } from '../../server/collections/comments/collection';
import { Tags } from '../../server/collections/tags/collection';
import { Revisions } from '../../server/collections/revisions/collection';
import gql from 'graphql-tag';

export const allTagsActivityFeedGraphQLTypeDefs = gql`
  type AllTagsActivityFeedQueryResults {
    cutoff: Date
    endOffset: Int!
    results: [AllTagsActivityFeedEntry!]
  }
  enum AllTagsActivityFeedEntryType {
    tagCreated
    tagRevision
    tagDiscussionComment
  }
  type AllTagsActivityFeedEntry {
    type: AllTagsActivityFeedEntryType!
    tagCreated: Tag
    tagRevision: Revision
    tagDiscussionComment: Comment
  }
  extend type Query {
    AllTagsActivityFeed(
      limit: Int,
      cutoff: Date,
      offset: Int
    ): AllTagsActivityFeedQueryResults!
  }
`

export const allTagsActivityFeedGraphQLQueries = {
  AllTagsActivityFeed: async (_root: void, args: any, context: ResolverContext) => {
    const {limit, cutoff, offset, ...rest} = args;
    type SortKeyType = Date;
    
    const result = await mergeFeedQueries<SortKeyType>({
      limit, cutoff, offset,
      subqueries: [
        // Tag creation
        viewBasedSubquery({
          type: "tagCreated",
          collection: Tags,
          sortField: "createdAt",
          context,
          includeDefaultSelector: false,
          selector: {}
        }),
        // Tag revisions
        viewBasedSubquery({
          type: "tagRevision",
          collection: Revisions,
          sortField: "editedAt",
          context,
          includeDefaultSelector: false,
          selector: {
            collectionName: "Tags",
            fieldName: "description",
            
            // Exclude no-change revisions (sometimes produced as a byproduct of
            // imports, metadata changes, etc)
            $or: [{
              "changeMetrics.added": {$gt: 0},
            }, {
              "changeMetrics.removed": {$gt: 0},
            }]
          },
        }),
        // Tag discussion comments
        viewBasedSubquery({
          type: "tagDiscussionComment",
          collection: Comments,
          sortField: "postedAt",
          context,
          includeDefaultSelector: false,
          selector: {
            tagId: {$ne: null},
          },
        }),
      ],
    });

    return {
      __typename: "AllTagsActivityFeedQueryResults",
      ...result
    }
  }
}
