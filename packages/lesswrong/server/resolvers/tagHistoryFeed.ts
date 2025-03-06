import { Comments } from '../../server/collections/comments/collection';
import { Tags } from '../../server/collections/tags/collection';
import { TagRels } from '../../server/collections/tagRels/collection';
import { Revisions } from '../../server/collections/revisions/collection';
import { accessFilterSingle } from '../../lib/utils/schemaUtils';
import { defineFeedResolver, mergeFeedQueries, fixedResultSubquery, viewBasedSubquery, fieldChangesSubquery } from '../utils/feedUtil';
import { MultiDocuments } from '@/server/collections/multiDocuments/collection';
import { defaultTagHistorySettings, TagHistorySettings } from '@/components/tagging/history/TagHistoryPage';
import { MAIN_TAB_ID } from '@/lib/arbital/useTagLenses';

defineFeedResolver<Date>({
  name: "TagHistoryFeed",
  args: "tagId: String!, options: JSON",
  cutoffTypeGraphQL: "Date",
  resultTypesGraphQL: `
    tagCreated: Tag
    tagApplied: TagRel
    tagRevision: Revision
    tagDiscussionComment: Comment
    lensRevision: Revision
    summaryRevision: Revision
    wikiMetadataChanged: FieldChange
    lensOrSummaryMetadataChanged: FieldChange
  `,
  resolver: async ({limit=25, cutoff, offset, args, context}: {
    limit?: number,
    cutoff?: Date,
    offset?: number,
    args: {tagId: string, options?: TagHistorySettings},
    context: ResolverContext
  }) => {
    const {tagId, options} = args;
    const historyOptions: TagHistorySettings = {...defaultTagHistorySettings, ...options};
    const {currentUser} = context;
    
    const tagRaw = await Tags.findOne({_id: tagId});
    if (!tagRaw) throw new Error("Tag not found");
    const tag = await accessFilterSingle(currentUser, Tags, tagRaw, context);
    if (!tag) throw new Error("Tag not found");
    
    type SortKeyType = Date
    
    const lensesAndSummaries = await MultiDocuments.find({
      parentDocumentId: tagId,
    }).fetch();
    const lenses = lensesAndSummaries.filter(md => md.fieldName==="description");
    const lensIds = (historyOptions.lensId && historyOptions.lensId !== "all")
      ? [historyOptions.lensId]
      : lenses.map(lens => lens._id);
    const summariesOfTag = lensesAndSummaries.filter(md => md.fieldName==="summary");
    
    const summariesOfLenses = lenses.length>0
      ? await MultiDocuments.find({
          parentDocumentId: {$in: lensIds},
          fieldName: "summary",
        }).fetch()
      : [];
    const summaries = [...summariesOfTag, ...summariesOfLenses];
    const summaryIds = summaries.map(summary => summary._id);

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
        (historyOptions.showTagging ? viewBasedSubquery({
          type: "tagApplied",
          collection: TagRels,
          sortField: "createdAt",
          context,
          selector: {tagId},
        }) : null),
        // Tag revisions
        (historyOptions.showEdits && (!historyOptions.lensId || historyOptions.lensId === "all" || historyOptions.lensId === MAIN_TAB_ID) ? viewBasedSubquery({
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
            /*$or: [{
              "changeMetrics.added": {$gt: 0},
            }, {
              "changeMetrics.removed": {$gt: 0},
            }]*/
          },
        }) : null),
        // Tag discussion comments
        (historyOptions.showComments ? viewBasedSubquery({
          type: "tagDiscussionComment",
          collection: Comments,
          sortField: "postedAt",
          context,
          selector: {
            parentCommentId: null,
            tagId,
            tagCommentType: "DISCUSSION",
          },
        }) : null),
        // Lens edits
        (historyOptions.showEdits ? {
          type: "lensRevision",
          getSortKey: (rev: DbRevision) => rev.editedAt,
          doQuery: async (limit: number, cutoff: Date|null): Promise<DbRevision[]> => {
            return await Revisions.find({
              documentId: {$in: lensIds},
              collectionName: "MultiDocuments",
              fieldName: "contents",
              ...(cutoff ? {editedAt: {$lt: cutoff}} : {}),
            }, {
              sort: {editedAt: -1},
              limit,
            }).fetch();
          },
        } : null),
        // Summary edits
        (historyOptions.showSummaryEdits ? {
          type: "summaryRevision",
          getSortKey: (rev: DbRevision) => rev.editedAt,
          doQuery: async (limit: number, cutoff: Date|null): Promise<DbRevision[]> => {
            return await Revisions.find({
              documentId: {$in: summaryIds},
              collectionName: "MultiDocuments",
              fieldName: "contents",
              ...(cutoff ? {editedAt: {$lt: cutoff}} : {}),
            }, {
              sort: {editedAt: -1},
              limit,
            }).fetch();
          },
        } : null),
        // Tag metadata changes
        (historyOptions.showMetadata ? fieldChangesSubquery({
          type: "wikiMetadataChanged",
          collection: Tags,
          context,
          documentIds: [tagRaw._id],
          fieldNames: ["name", "shortName", "subtitle", "core", "deleted"],
        }) : null),
        // Lens and summary metadata changes
        (historyOptions.showMetadata ? fieldChangesSubquery({
          type: "lensOrSummaryMetadataChanged",
          collection: MultiDocuments,
          context,
          documentIds: [...lensIds, ...summaryIds],
          fieldNames: ["title", "tabTitle", "tabSubtitle", "deleted"],
        }) : null),
      ],
    });
    return result;
  }
});

