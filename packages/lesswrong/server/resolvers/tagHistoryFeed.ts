import { Comments } from '../../lib/collections/comments/collection';
import { Tags } from '../../lib/collections/tags/collection';
import { TagRels } from '../../lib/collections/tagRels/collection';
import { Revisions } from '../../lib/collections/revisions/collection';
import { accessFilterSingle } from '../../lib/utils/schemaUtils';
import { defineFeedResolver, mergeFeedQueries, fixedResultSubquery, viewBasedSubquery } from '../utils/feedUtil';

defineFeedResolver<Date>({
  name: "TagHistoryFeed",
  args: "tagId: String!",
  cutoffTypeGraphQL: "Date",
  resultTypesGraphQL: `
    tagCreated: Tag
    tagApplied: TagRel
    tagRevision: Revision
    tagDiscussionComment: Comment
  `,
  resolver: async ({limit=50, cutoff, offset, args, context}: {
    limit?: number,
    cutoff?: Date,
    offset?: number,
    args: {tagId: string},
    context: ResolverContext
  }) => {
    const {tagId} = args;
    const {currentUser} = context;
    
    const tagRaw = await Tags.findOne({_id: tagId});
    const tag = await accessFilterSingle(currentUser, Tags, tagRaw, context);
    if (!tag) throw new Error("Tag not found");
    
    type SortKeyType = Date
    
    const result = await mergeFeedQueries<SortKeyType>({
      limit, cutoff, offset,
      subqueries: [
        // Tag creation
        fixedResultSubquery({
          type: "tagCreated",
          result: tag,
          sortKey: tag.createdAt,
        }),
        // Tag applications
        viewBasedSubquery({
          type: "tagApplied",
          collection: TagRels,
          sortField: "createdAt",
          context,
          selector: {tagId},
        }),
        // Tag revisions
        viewBasedSubquery({
          type: "tagRevision",
          collection: Revisions,
          sortField: "editedAt",
          context,
          selector: {
            documentId: tagId,
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
            parentCommentId: null,
            tagId,
            tagCommentType: "DISCUSSION",
          },
        }),
      ],
    });
    return result;
  }
});

