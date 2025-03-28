import { getVoteableCollections } from './collections/allCollections';
import { nullifyVotesForUserAndCollection } from './voteServer';



export async function nullifyVotesForUser(user: DbUser) {
  for (let collection of getVoteableCollections()) {
    await nullifyVotesForUserAndCollection(user, collection);
  }
}
