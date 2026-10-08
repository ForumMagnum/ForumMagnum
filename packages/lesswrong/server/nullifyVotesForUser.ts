import type { ForumTypeString } from "@/lib/instanceSettings";
import { getVoteableCollections } from './collections/allCollections';
import { nullifyVotesForUserAndCollection } from './voteServer';



export async function nullifyVotesForUser(user: DbUser, forumType: ForumTypeString) {
  for (let collection of getVoteableCollections()) {
    await nullifyVotesForUserAndCollection(user, collection, forumType);
  }
}
