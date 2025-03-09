import { mergeFeedQueries, defineFeedResolver, viewBasedSubquery } from '../utils/feedUtil';
import { Comments } from '../../server/collections/comments/collection';
import { Tags } from '../../server/collections/tags/collection';
import { Revisions } from '../../server/collections/revisions/collection';

defineFeedResolver<Date>({
  name: "AllTagsActivityFeed",
  args: "",
  cutoffTypeGraphQL: "Date",
  resultTypesGraphQL: `
    tagCreated: Tag
    tagRevision: Revision
    tagDiscussionComment: Comment
  `,
  resolver: async ({limit=20, cutoff, offset, args, context}: {
    limit?: number, cutoff?: Date, offset?: number,
    args: {af: boolean},
    context: ResolverContext
  }) => {
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
          selector: {}
        }),
        // Tag revisions
        viewBasedSubquery({
          type: "tagRevision",
          collection: Revisions,
          sortField: "editedAt",
          context,
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
          selector: {
            tagId: {$ne: null},
          },
        }),
      ],
    });
    return result;
  }
});

