import { Revisions } from '../../lib/collections/revisions/collection';
import { Tags } from '../../lib/collections/tags/collection';
import { Users } from '../../lib/collections/users/collection';
import { afterCreateRevisionCallback } from '../editor/make_editable_callbacks';
import { performVoteServer } from '../voteServer';
import { updateDenormalizedHtmlAttributions } from '../tagging/updateDenormalizedHtmlAttributions';
import { MultiDocuments } from '@/lib/collections/multiDocuments/collection';

// TODO: Now that the make_editable callbacks use createMutator to create
// revisions, we can now add these to the regular ${collection}.create.after
// callbacks

// Users upvote their own tag-revisions
afterCreateRevisionCallback.add(async ({revisionID}) => {
  const revision = await Revisions.findOne({_id: revisionID});
  if (!revision) return;
  if (revision.collectionName !== 'Tags') return;
  if (!revision.documentId) throw new Error("Revision is missing documentID");
  
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
});

// Update the denormalized htmlWithContributorAnnotations when a tag revision
// is created or edited
// Users upvote their own tag-revisions
afterCreateRevisionCallback.add(async ({revisionID, skipDenormalizedAttributions}) => {
  const revision = await Revisions.findOne({_id: revisionID});
  if (!revision) return;
  if (revision.collectionName !== 'Tags' && revision.collectionName !== 'MultiDocuments') return;
  if (skipDenormalizedAttributions) return;

  if (revision.collectionName === 'Tags') {
    const tag = await Tags.findOne({_id: revision.documentId});
    if (!tag) return;
    await updateDenormalizedHtmlAttributions({ document: tag, collectionName: 'Tags', fieldName: 'description' });
  } else if (revision.collectionName === 'MultiDocuments') {
    const multiDoc = await MultiDocuments.findOne({_id: revision.documentId});
    if (!multiDoc) return;
    await updateDenormalizedHtmlAttributions({ document: multiDoc, collectionName: 'MultiDocuments', fieldName: 'contents' });
  }
});
