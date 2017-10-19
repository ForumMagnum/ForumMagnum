import { Posts } from 'meteor/example-forum';
import Users from 'meteor/vulcan:users';
import { Votes } from 'meteor/vulcan:voting';
import { getSetting } from 'meteor/vulcan:core';
import { Random } from 'meteor/random';

async function runVoteMigration(collectionName) {
  try {
    //Abort early if votes collection is not empty
    if (Votes.findOne()) {
      console.log("Votes collection non-empty, aborting migration")
      return
    }
    console.log("Initializing vote migration for collection: ", collectionName)
    let newUpvotesPromise = Users.rawCollection().aggregate([
      {$match: {["upvoted" + collectionName]: {$exists: true}}},
      {$project: { ["upvoted" + collectionName]: 1 }},
      {$unwind: "$upvoted" + collectionName},
      {$project: {
         _id: 0,
         documentId: "$upvoted"+collectionName+".itemId",
         collectionName: {$literal: collectionName},
         userId: "$_id",
         voteType: {$literal: "upvote"},
         power: "$upvoted" + collectionName + ".power",
         votedAt: "$upvoted" + collectionName + ".votedAt"
      }},
    ])
    let newUpvotes = await newUpvotesPromise;
    let newUpvotesArray = await newUpvotes.toArray();
    let newDownvotesPromise = Users.rawCollection().aggregate([
      {$match: {["downvoted" + collectionName]: {$exists: true}}},
      {$project: { ["downvoted" + collectionName]: 1 }},
      {$unwind: "$downvoted" + collectionName},
      {$project: {
         _id: 0,
         documentId: "$downvoted"+collectionName+".itemId",
         collectionName: {$literal: collectionName},
         userId: "$_id",
         voteType: {$literal: "downvote"},
         power: "$downvoted" + collectionName + ".power",
         votedAt: "$downvoted" + collectionName + ".votedAt"
      }},
    ])
    let newDownvotes = await newDownvotesPromise;
    let newDownvotesArray = await newDownvotes.toArray();
    let votesArray = [...newDownvotesArray, ...newUpvotesArray]
    const newVoteMutations = votesArray.map((vote) => {
      vote._id = Random.id();
      return { insertOne : vote }
    })
    console.log("Migrating " + newVoteMutations.length + " votes...")
    await Votes.rawCollection().bulkWrite(newVoteMutations, {ordered: false})
    console.log("Finished vote migration for collection: ", collectionName);
   } catch (e) {
     console.log("Error during vote migration:");
    console.log(e);
   }
}

if (getSetting('runVoteMigration')) {
  runVoteMigration("Posts")
  runVoteMigration("Comments")
}
