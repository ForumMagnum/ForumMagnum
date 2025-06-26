import { performVoteServer } from '../voteServer';
import { updateDenormalizedHtmlAttributions } from '../tagging/updateDenormalizedHtmlAttributions';
import { recomputeContributorScoresFor } from '../utils/contributorsUtil';
import { UpdateCallbackProperties } from '../mutationCallbacks';

// Users upvote their own tag-revisions
export async function upvoteOwnTagRevision({revision, context}: {revision: DbRevision, context: ResolverContext}) {
  const { Revisions, Users } = context;
  if (revision.collectionName !== 'Tags') return;
  // This might be the first revision for a tag, in which case it doesn't have a documentId until later (and in that case we call this function in `updateRevisionDocumentId`)
  if (!revision.documentId) return;
  
  const userId = revision.userId;
  const user = await Users.findOne({_id:userId});
  if (!user) return;
  await performVoteServer({
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
