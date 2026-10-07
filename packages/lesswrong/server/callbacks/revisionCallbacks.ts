import { performVoteServer } from '../voteServer';
import { updateDenormalizedHtmlAttributions } from '../tagging/updateDenormalizedHtmlAttributions';
import { recomputeContributorScoresFor } from '../utils/contributorsUtil';
import { UpdateCallbackProperties } from '../mutationCallbacks';

// Users upvote their own tag-revisions
export async function upvoteOwnTagRevision({revision, context}: {revision: DbRevision, context: ResolverContext}) {
  const { Revisions, Tags, Users } = context;
  if (revision.collectionName !== 'Tags') return;
  // This might be the first revision for a tag, which is created before the tag
  // itself (with a placeholder documentId). In that case we call this function
  // again from `updateRevisionDocumentId` after the tag is inserted, and voting
  // now as well would make that second call toggle the vote off. Deliberately
  // not using the Tags loader, which would cache the not-found result.
  if (!revision.documentId) return;
  if (!(await Tags.findOne({_id: revision.documentId}, {}, {_id: 1}))) return;

  const userId = revision.userId;
  const user = await Users.findOne({_id:userId});
  if (!user) return;
  await performVoteServer({
    context,
    document: revision,
    collection: Revisions,
    voteType: 'smallUpvote',
    user,
    skipRateLimits: true,
    selfVote: true
  })
}

// Update the denormalized htmlWithContributorAnnotations when a tag revision
// is created or edited
export async function updateDenormalizedHtmlAttributionsDueToRev({revision, skipDenormalizedAttributions, context}: {revision: DbRevision, skipDenormalizedAttributions: boolean, context: ResolverContext}) {
  if (!skipDenormalizedAttributions) {
    await maybeUpdateDenormalizedHtmlAttributionsDueToRev(revision, context);
  }
}

async function maybeUpdateDenormalizedHtmlAttributionsDueToRev(revision: DbRevision, context: ResolverContext) {
  const { Tags, MultiDocuments } = context;
  if (revision.collectionName === 'Tags') {
    const tag = await Tags.findOne({_id: revision.documentId});
    if (!tag) return;
    await updateDenormalizedHtmlAttributions({ document: tag, collectionName: 'Tags', fieldName: 'description', context });
  } else if (revision.collectionName === 'MultiDocuments') {
    const multiDoc = await MultiDocuments.findOne({_id: revision.documentId});
    if (!multiDoc) return;
    await updateDenormalizedHtmlAttributions({ document: multiDoc, collectionName: 'MultiDocuments', fieldName: 'contents', context });
  }
}

export async function recomputeWhenSkipAttributionChanged({oldDocument, newDocument, context}: UpdateCallbackProperties<'Revisions'>) {
  if (oldDocument.skipAttributions !== newDocument.skipAttributions) {
    await recomputeContributorScoresFor(newDocument, context);
    await maybeUpdateDenormalizedHtmlAttributionsDueToRev(newDocument, context);
  }
};
