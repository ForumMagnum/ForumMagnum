import Users from "../../../lib/collections/users/collection";
import { userCanDo } from '../../../lib/vulcan-users/permissions';
import { Votes } from '../../../lib/collections/votes/collection';
import { calculateVotePower } from '../../../lib/voting/voteTypes'
import { getCollectionHooks } from '../../mutationCallbacks';
import type { VoteDocTuple } from '../../../lib/voting/vote';
import { ensureIndex } from "../../../lib/collectionIndexUtils";
import UsersRepo from "../../repos/UsersRepo";

export const recalculateAFBaseScore = async (document: VoteableType): Promise<number> => {
  let votes = await Votes.find({
    documentId: document._id,
    afPower: {$exists: true},
    cancelled: false,
  }).fetch()
  return votes ? votes.reduce((sum, vote) => { return (vote.afPower ?? 0) + sum }, 0) : 0
}

export function getVoteAFPower({user, voteType, document}: {
  user: DbUser|UsersCurrent,
  voteType: string,
  document: VoteableType,
}) {
  if (!userCanDo(user, "votes.alignment")) {
    return 0;
  }
  return calculateVotePower(user.afKarma, voteType);
}


async function updateUserAFKarmaForVote (newDocument: DbVoteableType, vote: DbVote, multiplier: number) {
  if (newDocument.af && (newDocument.userId !== vote.userId)) {
    const documentUser = await Users.findOne({_id:newDocument.userId})
    if (!documentUser) throw Error("Can't find user to update Alignment Karma")
    const karmaUpdate = (vote.afPower || 0) * multiplier;
    const newAfKarma = (documentUser.afKarma || 0) + karmaUpdate;
    if (newAfKarma > 0) {
      await Users.rawUpdateOne({_id:newDocument.userId}, {
        $inc: {afKarma: karmaUpdate},
        $addToSet: {groups: 'alignmentVoters'}
      })
    } else {
      // Need to use Math.abs since the multiplier is -1 for downvotes (which is almost certainly what's triggering this)
      await new UsersRepo().removeAlignmentGroupAndKarma(newDocument.userId!, Math.abs(karmaUpdate));
    }
  }
}

export async function grantUserAFKarmaForVote ({newDocument, vote}: VoteDocTuple) {
  await updateUserAFKarmaForVote(newDocument, vote, 1)
}

export async function revokeUserAFKarmaForCancelledVote ({newDocument, vote}: VoteDocTuple) {
  await updateUserAFKarmaForVote(newDocument, vote, -1)

}

export async function moveToAFUpdatesUserAFKarma (document: DbPost|DbComment, oldDocument: DbPost|DbComment) {
  if (document.af && !oldDocument.af) {
    await Users.rawUpdateOne({_id:document.userId}, {
      $inc: {afKarma: document.afBaseScore ?? 0},
      $addToSet: {groups: 'alignmentVoters'}
    })
    await Votes.rawUpdateMany({documentId: document._id}, {
      $set: {documentIsAf: true}
    }, {multi: true})
  } else if (!document.af && oldDocument.af) {
    const documentUser = await Users.findOne({_id:document.userId})
    if (!documentUser) throw Error("Can't find user for updating karma after moving document to AIAF")
    const karmaUpdate = -(document.afBaseScore ?? 0);
    const newAfKarma = (documentUser.afKarma || 0) + karmaUpdate;
    if (newAfKarma > 0) {
      await Users.rawUpdateOne({_id:document.userId}, {$inc: {afKarma: karmaUpdate}})
    } else {
      // Need to use Math.abs since the multiplier is -1 for downvotes (which is almost certainly what's triggering this)
      await new UsersRepo().removeAlignmentGroupAndKarma(document.userId, Math.abs(karmaUpdate));
    }
    await Votes.rawUpdateMany({documentId: document._id}, {
      $set: {documentIsAf: false}
    }, {multi: true})
  }
}
ensureIndex(Votes, {documentId:1});

getCollectionHooks("Posts").editAsync.add(moveToAFUpdatesUserAFKarma);
