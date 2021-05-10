import { Revisions } from '../../lib/collections/revisions/collection';
import { Users } from '../../lib/collections/users/collection';
import { afterCreateRevisionCallback } from '../editor/make_editable_callbacks';
import { performVoteServer } from '../voteServer';

afterCreateRevisionCallback.add(async ({revisionID}) => {
  const revision = await Revisions.findOne({_id: revisionID});
  if (!revision) return;
  if (revision.collectionName !== 'Tags') return;
  const userId = revision.userId;
  const user = await Users.findOne({_id:userId});
  if (!user) return;
  await performVoteServer({ document: revision, voteType: 'smallUpvote', collection: Revisions, user })
});
