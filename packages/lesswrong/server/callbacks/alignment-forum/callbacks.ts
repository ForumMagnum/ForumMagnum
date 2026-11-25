import Users from "../../../server/collections/users/collection";
import { userCanDo } from '../../../lib/vulcan-users/permissions';
import { Votes } from '../../../server/collections/votes/collection';
import { calculateVotePower } from '../../../lib/voting/voteTypes'
import type { VoteDocTuple } from '../../../lib/voting/vote';
import UsersRepo from "../../repos/UsersRepo";
import sumBy from "lodash/sumBy";

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


export function voteIsByAuthor(vote: DbVote, document: Pick<DbVoteableType, 'userId'>): boolean {
  return vote.userId === document.userId || !!vote.authorIds?.includes(vote.userId);
}

async function updateUserAFKarmaForVote (newDocument: DbVoteableType, vote: DbVote, multiplier: number) {
  if (!newDocument.af || !newDocument.userId || voteIsByAuthor(vote, newDocument)) {
    return;
  }
  const karmaUpdate = (vote.afPower || 0) * multiplier;
  if (karmaUpdate === 0) {
    return;
  }
  await new UsersRepo().applyAFKarmaChange(newDocument.userId, karmaUpdate);
}

export async function grantUserAFKarmaForVote ({newDocument, vote}: VoteDocTuple) {
  await updateUserAFKarmaForVote(newDocument, vote, 1)
}

export async function revokeUserAFKarmaForCancelledVote ({newDocument, vote}: VoteDocTuple) {
  await updateUserAFKarmaForVote(newDocument, vote, -1)

}

async function getAFKarmaFromNonAuthorVotes(document: Pick<DbPost|DbComment, 'userId' | '_id'>): Promise<number> {
  const votes = await Votes.find({
    documentId: document._id,
    cancelled: false,
  }).fetch();
  return sumBy(votes.filter(vote => !voteIsByAuthor(vote, document)), vote => vote.afPower ?? 0);
}

export async function moveToAFUpdatesUserAFKarma (document: Pick<DbPost|DbComment, 'af' | 'userId' | '_id'>, oldDocument: Pick<DbPost|DbComment, 'af' | 'userId' | '_id'>) {
  const movedToAF = document.af && !oldDocument.af;
  const movedOffAF = !document.af && oldDocument.af;
  if (!movedToAF && !movedOffAF) {
    return;
  }
  const afKarmaFromVotes = await getAFKarmaFromNonAuthorVotes(document);
  if (movedToAF) {
    await Users.rawUpdateOne({_id: document.userId}, {
      $inc: {afKarma: afKarmaFromVotes},
      $addToSet: {groups: 'alignmentVoters'}
    })
  } else if (afKarmaFromVotes !== 0) {
    await new UsersRepo().applyAFKarmaChange(document.userId, -afKarmaFromVotes);
  }
  await Votes.rawUpdateMany({documentId: document._id}, {
    $set: {documentIsAf: movedToAF}
  }, {multi: true})
}


export async function postsMoveToAFAddsAlignmentVoting (post: DbPost, oldPost: DbPost) {
  if (post.af && !oldPost.af) {
    await Users.rawUpdateOne({_id:post.userId}, {$addToSet: {groups: 'alignmentVoters'}})
  }
}
