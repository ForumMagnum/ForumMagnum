import Users from '../../server/collections/users/collection';
import { Votes } from '../../server/collections/votes/collection';
import { asyncForeachSequential } from '../../lib/utils/asyncUtils';
import { getCollection } from "../collections/allCollections";

export const rerunAFVotes = async () => {
  await Users.rawUpdateMany({}, {$set:{afKarma:0}}, {multi:true})
  const afVotes = await Votes.find({
    afPower:{$exists:true},
    cancelled:false,
  }).fetch()
  //eslint-disable-next-line no-console
  console.log(afVotes.length)
  await asyncForeachSequential(afVotes, async (vote, i) => {
    if (i%20 === 0) {
      //eslint-disable-next-line no-console
      console.log(i)
    }
    const collection = getCollection(vote.collectionName as VoteableCollectionName);
    const document = await collection.findOne({_id: vote.documentId}) as DbVoteableType;
    if (document.af) {
      await Users.rawUpdateOne({_id:document.userId}, {$inc: {afKarma: vote.afPower}})
    }
  })
}
