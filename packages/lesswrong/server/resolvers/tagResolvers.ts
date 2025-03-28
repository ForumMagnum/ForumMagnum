import { mergeFeedQueries, viewBasedSubquery, SubquerySortField, SortDirection } from '../utils/feedUtil';
import { Comments } from '../../server/collections/comments/collection';
import { Revisions } from '../../server/collections/revisions/collection';
import { Tags } from '../../server/collections/tags/collection';
import { TagRels } from '../../server/collections/tagRels/collection';
import { Posts } from '../../server/collections/posts/collection';
import { accessFilterMultiple, accessFilterSingle } from '../../lib/utils/schemaUtils';
import moment from 'moment';
import sumBy from 'lodash/sumBy';
import groupBy from 'lodash/groupBy';
import keyBy from 'lodash/keyBy';
import orderBy from 'lodash/orderBy';
import mapValues from 'lodash/mapValues';
import pick from 'lodash/pick';
import * as _ from 'underscore';
import {
  defaultSubforumSorting,
  SubforumSorting,
  subforumSortings,
  subforumSortingToResolverName,
  subforumSortingTypes,
} from '../../lib/collections/tags/subforumHelpers';
import { filterNonnull, filterWhereFieldsNotNull } from '../../lib/utils/typeGuardUtils';
import { userIsAdminOrMod } from '../../lib/vulcan-users/permissions';
import { taggingNamePluralSetting } from '../../lib/instanceSettings';
import difference from 'lodash/difference';
import { updatePostDenormalizedTags } from '../tagging/helpers';
import union from 'lodash/fp/union';
import { loadByIds } from '@/lib/loaders';
import { hasWikiLenses } from '@/lib/betas';
import { updateDenormalizedHtmlAttributions } from '../tagging/updateDenormalizedHtmlAttributions';
import { namedPromiseAll } from '@/lib/utils/asyncUtils';
import { updateDenormalizedContributorsList } from '../utils/contributorsUtil';
import { MultiDocuments } from '@/server/collections/multiDocuments/collection';
import { getLatestRev } from '../editor/utils';
import { updateMutator } from "../vulcan-lib/mutators";
import gql from 'graphql-tag';
import { createAdminContext } from '../vulcan-lib/createContexts';

type SubforumFeedSort = {
  posts: SubquerySortField<DbPost, keyof DbPost>,
  comments: SubquerySortField<DbComment, keyof DbComment>,
  sortDirection?: SortDirection,
}

const subforumFeedSortings: Record<SubforumSorting, SubforumFeedSort> = {
  magic: {
    posts: { sortField: "score" },
    comments: { sortField: "score" },
  },
  new: {
    posts: { sortField: "postedAt" },
    comments: { sortField: "postedAt" },
  },
  old: {
    posts: { sortField: "postedAt", sortDirection: "asc" },
    comments: { sortField: "postedAt", sortDirection: "asc" },
    sortDirection: "asc",
  },
  top: {
    posts: { sortField: "baseScore" },
    comments: { sortField: "baseScore" },
  },
  recentComments: {
    posts: { sortField: "lastCommentedAt" },
    comments: { sortField: "lastSubthreadActivity" },
  },
}

const createSubforumFeedResolver = <SortKeyType extends number | Date>(sorting: SubforumFeedSort) => async ({
  limit = 20, cutoff, offset, args: {tagId, af}, context,
}: {
  limit?: number,
  cutoff?: SortKeyType,
  offset?: number,
  args: {tagId: string, af?: boolean},
  context: ResolverContext,
}) => mergeFeedQueries({
  limit,
  cutoff,
  offset,
  sortDirection: sorting.sortDirection,
  subqueries: [
    // Subforum posts
    viewBasedSubquery({
      type: "tagSubforumPosts",
      collection: Posts,
      ...sorting.posts,
      context,
      selector: {
        [`tagRelevance.${tagId}`]: {$gte: 1},
        hiddenRelatedQuestion: undefined,
        shortform: undefined,
        groupId: undefined,
        ...(af ? {af: true} : undefined),
      },
    }),
    // Subforum comments
    viewBasedSubquery({
      type: "tagSubforumComments",
      collection: Comments,
      ...sorting.comments,
      context,
      selector: {
        $or: [{tagId: tagId, tagCommentType: "SUBFORUM"}, {relevantTagIds: tagId}],
        topLevelCommentId: {$exists: false},
        subforumStickyPriority: {$exists: false},
        ...(af ? {af: true} : undefined),
      },
    }),
    // Sticky subforum comments
    viewBasedSubquery({
      type: "tagSubforumStickyComments",
      collection: Comments,
      sortField: "subforumStickyPriority",
      sortDirection: "asc",
      sticky: true,
      context,
      selector: {
        tagId,
        tagCommentType: "SUBFORUM",
        topLevelCommentId: {$exists: false},
        subforumStickyPriority: {$exists: true},
        ...(af ? {af: true} : undefined),
      },
    }),
  ],
});

export const subForumFeedGraphQLTypeDefs = gql(subforumSortings.map(sorting => `
  type Subforum${subforumSortingToResolverName(sorting)}FeedQueryResults {
    cutoff: Date
    endOffset: Int!
    results: [Subforum${subforumSortingToResolverName(sorting)}FeedEntryType!]
  }
  type Subforum${subforumSortingToResolverName(sorting)}FeedEntryType {
    type: String!
    tagSubforumPosts: Post
    tagSubforumComments: Comment
    tagSubforumStickyComments: Comment
  }
  extend type Query {
    Subforum${subforumSortingToResolverName(sorting)}Feed(
      limit: Int
      cutoff: ${subforumSortingTypes[sorting]}
      offset: Int
      tagId: String!
      af: Boolean
    ): Subforum${subforumSortingToResolverName(sorting)}FeedQueryResults!
  }
`).join('\n'))

export const subForumFeedGraphQLQueries = {
  ...(Object.fromEntries(subforumSortings.map((sorting) => [
    `Subforum${subforumSortingToResolverName(sorting)}Feed`,
    createSubforumFeedResolver(subforumFeedSortings[sorting] ?? subforumFeedSortings[defaultSubforumSorting])
  ])))
}

export const tagGraphQLTypeDefs = gql`
  type DocumentDeletion {
    userId: String
    documentId: String!
    netChange: String!
    type: String
    docFields: MultiDocument
    createdAt: Date!
  }
  type TagUpdates {
    tag: Tag!
    revisionIds: [String!]
    commentCount: Int
    commentIds: [String!]
    lastRevisedAt: Date
    lastCommentedAt: Date
    added: Int
    removed: Int
    users: [User!]
    documentDeletions: [DocumentDeletion!]
  }
  type TagPreviewWithSummaries {
    tag: Tag!
    lens: MultiDocument
    summaries: [MultiDocument!]!
  }
  type TagWithTotalCount {
    tags: [Tag!]!
    totalCount: Int!
  }
  extend type Mutation {
    mergeTags(sourceTagId: String!, targetTagId: String!, transferSubtags: Boolean!, redirectSource: Boolean!): Boolean
    promoteLensToMain(lensId: String!): Boolean
  }
  extend type Query {
    TagUpdatesInTimeBlock(before: Date!, after: Date!): [TagUpdates!]
    TagUpdatesByUser(userId: String!, limit: Int!, skip: Int!): [TagUpdates!]
    RandomTag: Tag!
    ActiveTagCount: Int!
    TagPreview(slug: String!, hash: String): TagPreviewWithSummaries
    TagsByCoreTagId(coreTagId: String, limit: Int, searchTagIds: [String]): TagWithTotalCount!
  }
`;

interface TagUpdates {
  tag: Partial<DbTag>;
  revisionIds: string[] | null;
  commentCount: number | null;
  commentIds: string[] | null;
  lastRevisedAt: Date | null;
  lastCommentedAt: Date | null;
  added: number | null;
  removed: number | null;
  users: Partial<DbUser>[] | null;
  documentDeletions: CategorizedDeletionEvent[] | null;
}

function getRootCommentsInTimeBlockSelector(before: Date, after: Date) {
  return {
    deleted: false,
    postedAt: {$lt: before, $gt: after},
    topLevelCommentId: null,
    tagId: {$exists: true, $ne: null},
    tagCommentType: "DISCUSSION",
  };
}

function getDocumentDeletionsInTimeBlockSelector(documentIds: string[], before: Date, after: Date) {
  return {
    name: 'fieldChanges',
    $or: [
      { 'properties.before.deleted': {$exists: true} },
      { 'properties.after.deleted': {$exists: true} },
    ],
    documentId: {$in: documentIds},
    createdAt: {$lt: before, $gt: after},
  };
}

async function getRevisionAndCommentUsers(revisions: DbRevision[], rootComments: DbComment[], context: ResolverContext) {
  const revisionUserIds = revisions.map(tr => tr.userId);
  const commentUserIds = rootComments.map(rc => rc.userId);
  const userIds = filterNonnull(_.uniq([...revisionUserIds, ...commentUserIds]));

  const usersAll = await loadByIds(context, "Users", userIds);
  const users = await accessFilterMultiple(context.currentUser, 'Users', usersAll, context);

  // We need the cast because `keyBy` doesn't like it when you try to key on an optional field,
  // so it defaults to the overloaded version, which ends up treating the array as the object in question
  // and the return type is something dumb.
  // Of course _id on users isn't actually ever going to be missing, but `accessFilterMultiple` doesn't know that (and there is at least one collection where that'd be true, i.e. CronHistories).
  return keyBy(users, u => u._id) as Record<string, Partial<DbUser>>;
}

async function getMultiDocumentsByTagId(revisions: DbRevision[], context: ResolverContext) {
  const { MultiDocuments } = context;

  // Get the ids of MultiDocuments that have revisions in the given time interval
  const revisionMultiDocumentIds = revisions.filter(r=>r.collectionName==="MultiDocuments").map(r=>r.documentId);
  const multiDocumentIds = filterNonnull(_.uniq(revisionMultiDocumentIds));

  const multiDocumentsUnfiltered = await loadByIds(context, "MultiDocuments", multiDocumentIds);
  const multiDocuments = await accessFilterMultiple(context.currentUser, 'MultiDocuments', multiDocumentsUnfiltered, context);

  const lenses = multiDocuments.filter(md=>md.fieldName === "description" && md.collectionName === "Tags");
  const summaries = multiDocuments.filter(md=>md.fieldName === "summary");

  // Group the lenses and summaries by the tag they belong to
  const lensesByTagId = groupBy(lenses, md => md.parentDocumentId);
  const summariesByTagId = groupBy(summaries, md => md.parentDocumentId);

  return { lensesByTagId, summariesByTagId };

}

async function getTopLevelTags(revisions: DbRevision[], rootComments: DbComment[], lensIdsByTagId: Record<string, string[]>, summaryIdsByTagId: Record<string, string[]>, context: ResolverContext) {
  const revisionTagIds = revisions.filter(r=>r.collectionName==="Tags").map(r=>r.documentId);
  const commentTagIds = rootComments.map(c=>c.tagId);
  const tagIds = [...revisionTagIds, ...commentTagIds];
  const lensTagIds = Object.keys(lensIdsByTagId);
  const summaryTagIds = Object.keys(summaryIdsByTagId);
  const topLevelTagIds = filterNonnull(_.uniq([...tagIds, ...lensTagIds, ...summaryTagIds]));

  const tagsUnfiltered = await loadByIds(context, "Tags", topLevelTagIds);
  return await accessFilterMultiple(context.currentUser, 'Tags', tagsUnfiltered, context);
}

function getNetDeletionsByDocumentId(documentDeletions: DbLWEvent[]) {
  const deletionsByDocumentId = groupBy(documentDeletions, d=>d.documentId);

  // For each document, get the starting state and ending state, and then return an "event" signifying the net change _if_ there was a net change
  const deletionEventsByDocumentId = filterNonnull(
    Object.entries(deletionsByDocumentId).map(([documentId, deletions]) => {
      const sortedDeletions = orderBy(deletions, d=>d.createdAt, 'asc');
      const firstDeletionEvent = sortedDeletions[0];
      const lastDeletionEvent = sortedDeletions[sortedDeletions.length - 1];

      if (!firstDeletionEvent || !lastDeletionEvent) {
        return null;
      }

      const startingDeleted = firstDeletionEvent.properties.before.deleted;
      const endingDeleted = lastDeletionEvent.properties.after.deleted;
      if (startingDeleted === endingDeleted) {
        return null;
      }

      const netChange = endingDeleted ? 'deleted' : 'restored';
      const netChangeEvent = {
        userId: lastDeletionEvent.userId,
        documentId,
        netChange,
        createdAt: lastDeletionEvent.createdAt,
      }
      return [documentId, netChangeEvent] as const;
    })
  );

  return Object.fromEntries(deletionEventsByDocumentId);
}

interface GetDocumentDeletionsInTimeBlockArgs {
  before: Date,
  after: Date,
  lensesByTagId: Record<string, Partial<DbMultiDocument>[]>,
  summariesByTagId: Record<string, Partial<DbMultiDocument>[]>,
  context: ResolverContext,
}

interface CategorizedDeletionEvent {
  documentId: string;
  type?: 'lens' | 'summary';
  userId: string | null;
  docFields?: Pick<Partial<DbMultiDocument>, 'slug' | 'tabTitle' | 'tabSubtitle'>;
  createdAt: Date;
}

function hydrateDocumentDeletionEvent(deletionEvent: CategorizedDeletionEvent, lenses: Partial<DbMultiDocument>[], summaries: Partial<DbMultiDocument>[]): CategorizedDeletionEvent {
  const { documentId } = deletionEvent;
  const lens = lenses.find(lens => lens._id === documentId);
  if (lens) {
    const docFields = pick(lens, ['_id', 'slug', 'tabTitle', 'tabSubtitle']);
    return { ...deletionEvent, type: 'lens', docFields };
  }
  const summary = summaries.find(summary => summary._id === documentId);
  if (summary) {
    const docFields = pick(summary, ['_id', 'slug', 'tabTitle', 'tabSubtitle']);
    return { ...deletionEvent, type: 'summary', docFields };
  }
  return deletionEvent;
}

function getParentTagId(documentId: string, lensesByTagId: Record<string, Partial<DbMultiDocument>[]>, summariesByTagId: Record<string, Partial<DbMultiDocument>[]>) {
  const matchingLensTagId = Object.keys(lensesByTagId)
    .find(tagId => lensesByTagId[tagId]
    .some(lens => lens._id === documentId));

  if (matchingLensTagId) {
    return matchingLensTagId;
  }

  const matchingSummaryTagId = Object.keys(summariesByTagId)
    .find(tagId => summariesByTagId[tagId]
    .some(summary => summary._id === documentId));

  if (matchingSummaryTagId) {
    return matchingSummaryTagId;
  }

  return null;
}

async function getDocumentDeletionsInTimeBlock({before, after, lensesByTagId, summariesByTagId, context}: GetDocumentDeletionsInTimeBlockArgs) {
  if (!hasWikiLenses) {
    return {};
  }

  const { LWEvents } = context;

  const lenses = Object.values(lensesByTagId).flat();
  const summaries = Object.values(summariesByTagId).flat();

  const lensIds = filterNonnull(_.uniq(lenses.map(l => l._id)));
  const summaryIds = filterNonnull(_.uniq(summaries.map(s => s._id)));
  const documentIds = _.uniq([...lensIds, ...summaryIds]);

  const documentDeletionsSelector = getDocumentDeletionsInTimeBlockSelector(documentIds, before, after);
  const documentDeletions = await LWEvents.find(documentDeletionsSelector).fetch();

  const documentDeletionEvents = getNetDeletionsByDocumentId(documentDeletions);

  // First, categorize the deletions by whether they were for a lens or summary
  const categorizedDeletionEvents: Record<string, CategorizedDeletionEvent> = mapValues(
    documentDeletionEvents,
    (deletionEvent) => hydrateDocumentDeletionEvent(deletionEvent, lenses, summaries)
  );

  // Then group by the tag that each deletion event's document is a child of
  const deletionEventsByTagId: Record<string, CategorizedDeletionEvent[]> = {};

  Object.values(categorizedDeletionEvents).reduce((acc, deletionEvent) => {
    const { documentId } = deletionEvent;
    const prev = acc[documentId] ?? [];
    const matchingTagId = getParentTagId(documentId, lensesByTagId, summariesByTagId);
    if (matchingTagId) {
      acc[matchingTagId] = [...prev, deletionEvent];
    }
    return acc;
  }, deletionEventsByTagId);

  return deletionEventsByTagId;
}

function isTagUpdateEmpty(tagUpdate: TagUpdates) {
  return !tagUpdate.revisionIds?.length
      && !tagUpdate.commentCount
      && !tagUpdate.commentIds?.length
      && !tagUpdate.lastRevisedAt
      && !tagUpdate.lastCommentedAt
      && !tagUpdate.added
      && !tagUpdate.removed
      && !tagUpdate.users?.length
      && !tagUpdate.documentDeletions?.length;
}

export const tagResolversGraphQLMutations = {
  async mergeTags(
    root: void,
    {
      sourceTagId,
      targetTagId,
      transferSubtags,
      redirectSource,
    }: { sourceTagId: string; targetTagId: string; transferSubtags: boolean; redirectSource: boolean },
    context: ResolverContext
  ) {
    const { currentUser } = context;

    if (!userIsAdminOrMod(currentUser)) {
      throw new Error(`Must be an admin/mod to merge ${taggingNamePluralSetting.get()}`);
    }
    if (!sourceTagId || !targetTagId) {
      throw new Error("sourceTagId and targetTagId required");
    }

    const sourceTag = await Tags.findOne({ _id: sourceTagId });
    const targetTag = await Tags.findOne({ _id: targetTagId });

    if (!sourceTag) {
      throw new Error(`Could not find source tag with _id: ${sourceTagId}`);
    }
    if (!targetTag) {
      throw new Error(`Could not find target tag with _id: ${targetTagId}`);
    }

    //
    // Transfer posts
    //
    // 1. To preserve the source of the votes, just update the tagId of the TagRels for posts where the source tag is added but not the target
    // 2. For posts where both the source and target are already added, soft delete the source TagRel
    //
    // Note that for both of these we don't distinguish between positive and negative votes, so if a post has the source tag downvoted (hence unapplied)
    // this downvote will be copied over to the target

    const sourceTagRels = await TagRels.find({tagId: sourceTagId, deleted: false}).fetch()
    const targetTagRels = await TagRels.find({tagId: targetTagId, deleted: false}).fetch()

    const sourcePostIds = sourceTagRels.map(tr => tr.postId)
    const targetPostIds = targetTagRels.map(tr => tr.postId)

    const sourceOnlyPostIds = difference(sourcePostIds, targetPostIds);
    const sourceAndTargetPostIds = difference(sourcePostIds, sourceOnlyPostIds)

    // Transfer TagRels for posts with only the source tag
    await TagRels.rawUpdateMany(
      { tagId: sourceTagId, postId: { $in: sourceOnlyPostIds } },
      { $set: { tagId: targetTagId } },
      { multi: true }
    );
    // TODO: This is fragile, once denormalizedCountOfReferences can do full recalulations
    // make it use that (pending https://app.asana.com/0/628521446211730/1206130592328269/f)
    await Tags.rawUpdateOne(sourceTag._id, { $inc: {postCount: -sourceOnlyPostIds.length}})
    await Tags.rawUpdateOne(targetTag._id, { $inc: {postCount: sourceOnlyPostIds.length}})

    // Soft delete TagRels for posts with both the source and target tag, note that the corresponding votes don't need to be deleted
    await TagRels.rawUpdateMany(
      { tagId: sourceTagId, postId: { $in: sourceAndTargetPostIds } },
      { $set: { deleted: true } },
      { multi: true }
    );
    await Tags.rawUpdateOne(sourceTag._id, { $inc: {postCount: -sourceAndTargetPostIds.length}})

    // Call updatePostDenormalizedTags(postId) for all (unique) posts in sourcePostIds, targetPostIds
    const uniquePostIds = union(sourceOnlyPostIds, sourceAndTargetPostIds);
    const updateDenormalizedTags = async () => {
      for (const postId of uniquePostIds) {
        try {
          await updatePostDenormalizedTags(postId)
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error(e)
        }
      }
    }
    // Don't await this, because it might cause a timeout
    void updateDenormalizedTags();

    //
    // Transfer sub-tags
    //
    if (transferSubtags) {
      const sourceSubTags = await Tags.find({ parentTagId: sourceTagId }).fetch()

      for (const subTag of sourceSubTags) {
        await updateMutator({
          collection: Tags,
          documentId: subTag._id,
          // This will run a callback to update the subTags field on the parent tag
          set: { parentTagId: targetTagId },
          validate: false,
        });
      }
    }

    //
    // Soft delete source and redirect
    //
    if (redirectSource) {
      const originalSourceSlug = sourceTag.slug;
      const deletedSourceSlug = `${originalSourceSlug}-deleted`;

      // Update the source slug as a raw update so the original doesn't get added to `oldSlugs`
      await Tags.rawUpdateOne({ _id: sourceTagId }, { $set: { slug: deletedSourceSlug } });
      // Update oldSlugs on the target so requests for the original source tag redirect to the target
      await Tags.rawUpdateOne(
        { _id: targetTagId },
        {
          $addToSet: {
            oldSlugs: originalSourceSlug,
          },
        }
      );

      // Soft delete the source tag, making sure to run the callbacks
      await updateMutator({
        collection: Tags,
        documentId: sourceTagId,
        set: { deleted: true },
        validate: false,
      });
    }

    return true;
  },
  async promoteLensToMain(root: void, {lensId}: {lensId: string}, context: ResolverContext) {
    if (!userIsAdminOrMod(context.currentUser)) {
      throw new Error("Only admins can promote lenses to main");
    }

    // eslint-disable-next-line no-console
    console.log(`Promoting lens ${lensId} to main`);
    
    // Find the lens and corresponding tag
    const lensMultiDocument = await context.loaders.MultiDocuments.load(lensId);
    if (!lensMultiDocument) throw new Error("Lens ID not found: "+lensId);
    if (lensMultiDocument.fieldName !== "description") {
      throw new Error("lensId is not a lens");
    }
    const tagId = lensMultiDocument.parentDocumentId;
    const tag = await context.loaders.Tags.load(tagId);
    if (!tag) throw new Error("Could not find corresponding tag for lens ID: "+lensId);
    
    // Swap revisions
    const { tagRevisions, lensRevisions } = await namedPromiseAll({
      tagRevisions: Revisions.find({ documentId: tagId }).fetch(),
      lensRevisions: Revisions.find({ documentId: lensId }).fetch(),
    });
    const latestTagRevisionId = tag.description_latest;
    const latestLensRevisionId = lensMultiDocument.contents_latest;
    const latestLensRevision = lensRevisions.find(l => l._id===latestLensRevisionId);
    if (!latestLensRevision) throw new Error("Couldn't find latest lens revision");
    console.log(`Moving ${tagRevisions.length} revisions from tag to lens`); //eslint-disable-line no-console
    console.log(`Moving ${lensRevisions.length} revisions from lens to tag`); //eslint-disable-line no-console
    await Promise.all([
      // Move revs from tag to lens
      Revisions.rawUpdateMany(
        {_id: {$in: tagRevisions.map(r => r._id)}},
        {$set: {
          documentId: lensMultiDocument._id,
          collectionName: "MultiDocuments",
          fieldName: "contents",
        }}
      ),
      // Move revs from lens to tag
      Revisions.rawUpdateMany(
        {_id: {$in: lensRevisions.map(r => r._id)}},
        {$set: {
          documentId: tag._id,
          collectionName: "Tags",
          fieldName: "description",
        }}
      )
    ]);
    
    await Tags.rawUpdateOne(
      {_id: tag._id},
      {$set: {
        description: {
          ...pick(latestLensRevision, [
            "html", "version", "userId", "editedAt", "wordCount",
            "originalContents", "commitMessage", "googleDocMetadata", "updateType"
          ])
        }
      }},
    );
    
    // Swap the description_latest field
    await Promise.all([
      Tags.rawUpdateOne(
        {_id: tagId},
        {$set: {
          description_latest: latestLensRevisionId
        }}
      ),
      context.MultiDocuments.rawUpdateOne(
        {_id: lensMultiDocument._id},
        {$set: {
          contents_latest: latestTagRevisionId
        }}
      )
    ]);

    // Recompute denormalized fields
    await Promise.all([
      updateDenormalizedHtmlAttributions({
        document: tag,
        collectionName: "Tags",
        fieldName: "description",
        context,
      }),
      updateDenormalizedHtmlAttributions({
        document: lensMultiDocument,
        collectionName: "MultiDocuments",
        fieldName: "contents",
        context,
      }),
      updateDenormalizedContributorsList({
        document: tag,
        collectionName: "Tags",
        fieldName: "description",
        context,
      }),
      updateDenormalizedContributorsList({
        document: lensMultiDocument,
        collectionName: "MultiDocuments",
        fieldName: "contents",
        context,
      }),
    ]);
    
    // eslint-disable-next-line no-console
    console.log(`Finished promoting lens ${lensId} to main`);
    return true;
  },
}

export const tagResolversGraphQLQueries = {
  async TagUpdatesInTimeBlock(root: void, {before,after}: {before: Date, after: Date}, context: ResolverContext) {
    if (!before) throw new Error("Missing graphql parameter: before");
    if (!after) throw new Error("Missing graphql parameter: after");
    if(moment.duration(moment(before).diff(after)).as('hours') > 30)
      throw new Error("TagUpdatesInTimeBlock limited to a one-day interval");
    
    const rootCommentsSelector = getRootCommentsInTimeBlockSelector(before, after);

    // Get
    // - revisions to tags, lenses, and summaries in the given time interval
    // - root comments on tags in the given time interval
    const [revisions, rootComments] = await Promise.all([
      context.repos.revisions.getRevisionsInTimeBlock(before, after),
      Comments.find(rootCommentsSelector).fetch()
    ]);
    
    const [usersById, { lensesByTagId, summariesByTagId }] = await Promise.all([
      getRevisionAndCommentUsers(revisions, rootComments, context),
      getMultiDocumentsByTagId(revisions, context),
    ]);

    const lensIdsByTagId = mapValues(lensesByTagId, lenses => lenses.map(l => l._id!));
    const summaryIdsByTagId = mapValues(summariesByTagId, summaries => summaries.map(s => s._id!));

    const [tags, documentDeletionsByTagId] = await Promise.all([
      getTopLevelTags(revisions, rootComments, lensIdsByTagId, summaryIdsByTagId, context),
      getDocumentDeletionsInTimeBlock({
        before,
        after,
        lensesByTagId,
        summariesByTagId,
        context,
      }),
    ]);

    // We use all revisions above because we use content-less revisions to figure out
    // what documents have been deleted (since updating the `deleted` field of a tag or multidoc creates a new revision, even if the content hasn't changed).
    // But for actually showing revisions with diffs, we only want to show the ones that have content changes.
    const contentfulRevisions = revisions.filter(rev => rev.changeMetrics.added > 0 || rev.changeMetrics.removed > 0);

    // TODO: figure out if we want to get relevant user ids based on all revisions, or just contentful ones

    const tagUpdates = tags.map(tag => {
      const relevantTagRevisions = contentfulRevisions.filter(rev=>rev.documentId===tag._id);
      const relevantLensRevisions = contentfulRevisions.filter(rev=>lensIdsByTagId[tag._id!]?.includes(rev.documentId!));
      const relevantSummaryRevisions = contentfulRevisions.filter(rev=>summaryIdsByTagId[tag._id!]?.includes(rev.documentId!));
      const relevantRevisions = [...relevantTagRevisions, ...relevantLensRevisions, ...relevantSummaryRevisions];

      const relevantDocumentDeletions = documentDeletionsByTagId[tag._id!];

      const relevantRootComments = rootComments.filter(c=>c.tagId===tag._id);
      const relevantUsersIds = filterNonnull(_.uniq([...relevantTagRevisions.map(tr => tr.userId), ...relevantRootComments.map(rc => rc.userId)]));
      const relevantUsers = relevantUsersIds.map(userId=>usersById[userId]);
      
      return {
        tag,
        revisionIds: relevantRevisions.map(r=>r._id),
        commentCount: relevantRootComments.length + sumBy(relevantRootComments, c=>c.descendentCount),
        commentIds: relevantRootComments.map(c=>c._id),
        lastRevisedAt: relevantRevisions.length>0 ? _.max(relevantRevisions, r=>r.editedAt).editedAt : null,
        lastCommentedAt: relevantRootComments.length>0 ? _.max(relevantRootComments, c=>c.lastSubthreadActivity).lastSubthreadActivity : null,
        added: sumBy(relevantRevisions, r=>r.changeMetrics.added),
        removed: sumBy(relevantRevisions, r=>r.changeMetrics.removed),
        users: relevantUsers,
        documentDeletions: relevantDocumentDeletions,
      };
    });
    
    // Filter out empty tag updates, which we might have because we're no longer filtering out revisions with no content changes
    // These can happen when e.g. a tag's name is changed, since the tag update automatically creates a zero-diff revision
    return tagUpdates.filter(tagUpdate => !isTagUpdateEmpty(tagUpdate));
  },
  
  async RandomTag(root: void, args: void, context: ResolverContext): Promise<DbTag> {
    const sample = await Tags.aggregate([
      {$match: {
        deleted: false, adminOnly: false,
        isPlaceholderPage: false,
      }},
      {$sample: {size: 1}}
    ]).toArray();
    if (!sample || !sample.length)
      throw new Error("No tags found");
    return sample[0];
  },
  
  async TagUpdatesByUser(root: void, {userId,limit,skip}: {userId: string, limit: number, skip: number}, context: ResolverContext) {

    // Get revisions to tags
    const rawTagRevisions = await Revisions.find({
      collectionName: "Tags",
      fieldName: "description",
      userId,
      documentId: { $exists: true},
      $or: [
        {"changeMetrics.added": {$gt: 0}},
        {"changeMetrics.removed": {$gt: 0}}
      ],
    }, { limit, skip, sort: { editedAt: -1} }).fetch();

    const tagRevisions = filterWhereFieldsNotNull(rawTagRevisions, "documentId")

    // Get the tags themselves, keyed by the id
    const tagIds = filterNonnull(_.uniq(tagRevisions.map(r=>r.documentId)))
    const tagsUnfiltered = await loadByIds(context, "Tags", tagIds);
    const tags = (await accessFilterMultiple(context.currentUser, 'Tags', tagsUnfiltered, context)).reduce( (acc: Partial<Record<string,DbTag>>, tag: DbTag) => {
      acc[tag._id] = tag;
      return acc;
    }, {});

    // unlike TagUpdatesInTimeBlock we only return info on one revision per tag. i.e. we do not collect them by tag.
    return tagRevisions.map(rev => {
      const tag = tags[rev.documentId];
      return {
        tag,
        revisionIds: [rev._id],
        lastRevisedAt: rev.editedAt,
        added: rev.changeMetrics.added,
        removed: rev.changeMetrics.removed,
      };
    });
  },

  ActiveTagCount: () => Tags.find({deleted: {$ne: true}}).count(),

  TagPreview: async (root: void, {slug, hash}: {slug: string, hash: string | null}, context: ResolverContext) => {
    const { Tags, MultiDocuments, repos, currentUser } = context;

    const tagWithSummaries = await repos.tags.getTagWithSummaries(slug);

    if (!tagWithSummaries) return null;

    const { summaries, lens, ...tag } = tagWithSummaries;

    const [filteredTag, filteredLens, filteredSummaries] = await Promise.all([
      accessFilterSingle(currentUser, 'Tags', tag, context),
      accessFilterSingle(currentUser, 'MultiDocuments', lens, context),
      accessFilterMultiple(currentUser, 'MultiDocuments', summaries, context)
    ]);

    if (!filteredTag) return null;

    return {
      tag: filteredTag,
      lens: filteredLens,
      summaries: filteredSummaries,
    };
  },

  TagsByCoreTagId: async (root: void, {coreTagId, limit = 20, searchTagIds}: {coreTagId: string | null, limit: number, searchTagIds: string[]}, context: ResolverContext) => {
    const { tags: unsortedTags, totalCount } = await context.repos.tags.getTagsByCoreTagId(
      coreTagId,
      limit,
      searchTagIds
    );
    
    const tags = searchTagIds?.length
      ? sortTagsByIdOrder(unsortedTags, searchTagIds)
      : unsortedTags;

    return { tags, totalCount };
  }

}

function sortTagsByIdOrder(tags: DbTag[], orderIds: string[]): DbTag[] {
  const tagsByIdMap = keyBy(tags, '_id');
  return filterNonnull(orderIds.map(id => tagsByIdMap[id]));
}

// Exported to allow running from "yarn repl"
export const recomputeDenormalizedContentsFor = async (tagSlug: string) => {
  const context = createAdminContext();
  const tag = await Tags.findOne({slug: tagSlug});
  if (!tag) throw new Error(`No such tag: ${tagSlug}`);
  const latestRev = await getLatestRev(tag._id, "description", context);
  if (!latestRev) throw new Error("Could not get latest rev");
  await Tags.rawUpdateOne(
    {_id: tag._id},
    {$set: {
      description: {
        ...pick(latestRev, [
          "html", "version", "userId", "editedAt", "wordCount",
          "originalContents", "commitMessage", "googleDocMetadata", "updateType"
        ])
      }
    }},
  );
}

// Exported to allow running from "yarn repl"
export const recomputeDenormalizedContributorsAndAttributionsOn = async (tagSlug: string) => {
  const resolverContext = createAdminContext();
  const { Tags } = resolverContext;

  const tag = await Tags.findOne({slug: tagSlug});
  if (!tag) throw new Error(`No such tag: ${tagSlug}`);
  const lenses = await MultiDocuments.find({
    parentDocumentId: tag._id,
    fieldName: "description",
  }).fetch();
  // eslint-disable-next-line no-console
  console.log(`Found ${lenses.length} lenses`);

  await updateDenormalizedHtmlAttributions({
    document: tag,
    collectionName: "Tags",
    fieldName: "description",
    context: resolverContext,
  });
  await updateDenormalizedContributorsList({
    document: tag,
    collectionName: "Tags",
    fieldName: "description",
    context: resolverContext,
  });
  for (const lensMultiDocument of lenses) {
    await updateDenormalizedHtmlAttributions({
      document: lensMultiDocument,
      collectionName: "MultiDocuments",
      fieldName: "contents",
      context: resolverContext,
    });
    await updateDenormalizedContributorsList({
      document: lensMultiDocument,
      collectionName: "MultiDocuments",
      fieldName: "contents",
      context: resolverContext,
    });
  }
}
