import { voteTypes } from "../../voting/voteTypes";
import { userCanDo } from "../../vulcan-users";
import { getConfirmedCoauthorIds } from "../posts/helpers";
import { userCanVote } from "../users/helpers";

export const getVoteErrorMessage = async function ({collectionName, voteType, user, selfVote, extendedVote, document, post}: {
  collectionName: CollectionNameString,
  voteType: string,
  user: DbUser,
  selfVote?: boolean,
  extendedVote?: any,
  document: DbVoteableType,
  post?: PostsMinimumInfo
}) {  
  const collectionVoteType = `${collectionName.toLowerCase()}.${voteType}`

  if (!user) return "Error casting vote: Not logged in."
  
  // Check whether the user is allowed to vote at all, in full generality
  const { fail: cannotVote, reason } = userCanVote(user);
  if (!selfVote && cannotVote) {
    return reason
  }

  if (!extendedVote && voteType && voteType !== "neutral" && !userCanDo(user, collectionVoteType)) {
    return `Error casting vote: User can't cast votes of type ${collectionVoteType}.`
  }
  if (!voteTypes[voteType]) return `Invalid vote type in performVoteServer: ${voteType}`

  if (!selfVote && collectionName === "Comments" && (document as DbComment).debateResponse) {
    const userIds = post ? [...getConfirmedCoauthorIds(post), post.userId] : [];
    if (!userIds.includes(user._id)) {
      return "Cannot vote on debate responses unless you're an accepted coauthor"
    }
  }

  if (collectionName==="Revisions" && (document as DbRevision).collectionName!=='Tags')
    return "Revisions are only voteable if they're revisions of tags"
  
  return
}