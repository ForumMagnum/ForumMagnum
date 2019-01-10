import Votes from './collections/votes/collection.js';

// This file is server-side-only, but lives in an included-with-client-bundle
// directory because we don't have a good way to make resolvers, or imports
// used by resolvers, be server specific.

// Given a user and a date range, get a summary of karma changes that occurred
// during that date range.
//
// For example:
// {
//   totalChange: 10,
//   startDate: Date("2018-09-09"),
//   endDate: Date("2018-09-10"),
//   documents: [
//     {
//       _id: "12345",
//       collectionName: "Posts",
//       scoreChange: 3,
//     },
//     {
//       _id: "12345",
//       collectionName: "Comments",
//       scoreChange: -1,
//     },
//   ]
// }
export async function getKarmaChanges({user, startDate, endDate})
{
  if (!user) throw new Error("Missing required argument: user");
  if (!startDate) throw new Error("Missing required argument: startDate");
  if (!endDate) throw new Error("Missing required argument: endDate");
  if (startDate > endDate)
    throw new Error("getKarmaChanges: endDate must be after startDate");
  
  let changedDocs = await Votes.rawCollection().aggregate([
    // Get votes cast on this user's content (including cancelled votes)
    {$match: {
      authorId: user._id,
      votedAt: {$gte: startDate, $lte: endDate}
    }},
    
    // Group by thing-that-was-voted-on and calculate the total karma change
    {$group: {
      _id: "$documentId",
      collectionName: { $first: "$collectionName" },
      scoreChange: { $sum: "$power" },
    }},
  ]).toArray();
  
  let totalChange = 0;
  for (let changedDoc of changedDocs) {
    totalChange += changedDoc.scoreChange;
  }
  
  return {
    totalChange: totalChange,
    startDate: startDate,
    endDate: endDate,
    documents: changedDocs,
  };
}
