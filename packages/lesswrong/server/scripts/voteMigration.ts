import { randomId } from '../../lib/random';
import Users from '../../lib/collections/users/collection';
import { Votes } from '../../lib/collections/votes/collection';

export async function runVoteMigration(collectionName: CollectionNameString) {
  try {
    //Abort early if votes collection is not empty
    if (await Votes.findOneArbitrary()) {
      //eslint-disable-next-line no-console
      console.error("Votes collection non-empty, aborting migration")
      return
    }
    //eslint-disable-next-line no-console
    console.log("Initializing vote migration for collection: ", collectionName)
    let newUpvotesPromise = Users.aggregate([
      {$match: {["upvoted" + collectionName]: {$exists: true}}},
      {$project: { ["upvoted" + collectionName]: 1 }},
      {$unwind: "$upvoted" + collectionName},
      {$project: {
         _id: 0,
         documentId: "$upvoted"+collectionName+".itemId",
         collectionName: {$literal: collectionName},
         userId: "$_id",
         voteType: {$literal: "smallUpvote"},
         power: "$upvoted" + collectionName + ".power",
         votedAt: "$upvoted" + collectionName + ".votedAt"
      }},
    ])
    let newUpvotes = await newUpvotesPromise;
    let newUpvotesArray = await newUpvotes.toArray();
    let newDownvotesPromise = Users.aggregate([
      {$match: {["downvoted" + collectionName]: {$exists: true}}},
      {$project: { ["downvoted" + collectionName]: 1 }},
      {$unwind: "$downvoted" + collectionName},
      {$project: {
         _id: 0,
         documentId: "$downvoted"+collectionName+".itemId",
         collectionName: {$literal: collectionName},
         userId: "$_id",
         voteType: {$literal: "smallDownvote"},
         power: "$downvoted" + collectionName + ".power",
         votedAt: "$downvoted" + collectionName + ".votedAt"
      }},
    ])
    let newDownvotes = await newDownvotesPromise;
    let newDownvotesArray = await newDownvotes.toArray();
    let votesArray = [...newDownvotesArray, ...newUpvotesArray]
    const newVoteMutations = votesArray.map((vote) => {
      vote._id = randomId();
      return { insertOne : vote }
    })
    //eslint-disable-next-line no-console
    console.log("Migrating " + newVoteMutations.length + " votes...")
    await Votes.rawCollection().bulkWrite(newVoteMutations, {ordered: false})
    //eslint-disable-next-line no-console
    console.log("Finished vote migration for collection: ", collectionName);
   } catch (e) {
     //eslint-disable-next-line no-console
     console.error("Error during vote migration:", e);
   }
}
