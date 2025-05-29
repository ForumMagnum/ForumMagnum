import { DatabaseIndexSet } from "../../lib/utils/databaseIndexSet";

export function getDbIndexesOnVotes() {
  const indexSet = new DatabaseIndexSet();

  indexSet.addIndex("Votes", {cancelled:1, userId:1, documentId:1});
  indexSet.addIndex("Votes", {cancelled:1, documentId:1});
  indexSet.addIndex("Votes", {cancelled:1, userId:1, votedAt:-1});
  
  // Used by getKarmaChanges
  indexSet.addIndex("Votes", {authorIds: 1});
  
  // Used by getUsersTopUpvotedUsers - the index that put `cancelled` first was not very helpful for this since it was doing a full index scan
  indexSet.addIndex("Votes", { userId: 1, cancelled: 1, votedAt: 1 });
  
  indexSet.addIndex("Votes", {collectionName: 1, votedAt: 1})
  
  indexSet.addIndex("Votes", {collectionName: 1, userId: 1, voteType: 1, cancelled: 1, isUnvote: 1, votedAt: 1})

  indexSet.addIndex("Votes", {userId: 1, collectionName: 1, cancelled: 1, votedAt: 1})

  indexSet.addIndex("Votes", {documentId:1});

  return indexSet;
}
