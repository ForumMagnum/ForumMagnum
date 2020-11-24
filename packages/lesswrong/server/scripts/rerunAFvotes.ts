import Users from '../../lib/collections/users/collection';
import { Votes } from '../../lib/collections/votes';
import { Vulcan, getCollection } from '../vulcan-lib';

Vulcan.rerunAFVotes = () => {
  Users.update({}, {$set:{afKarma:0}}, {multi:true})
  const afVotes = Votes.find({
    afPower:{$exists:true},
    cancelled:false,
  }).fetch()
  //eslint-disable-next-line no-console
  console.log(afVotes.length)
  afVotes.forEach((vote, i)=> {
    if (i%20 == 0) {
      //eslint-disable-next-line no-console
      console.log(i)
    }
    const collection = getCollection(vote.collectionName as VoteableCollectionName);
    const document = collection.findOne({_id: vote.documentId}) as VoteableType;
    if (document.af) {
      Users.update({_id:document.userId}, {$inc: {afKarma: vote.afPower}})
    }
  })
}
