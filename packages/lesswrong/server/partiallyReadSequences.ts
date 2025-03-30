import Users from '../server/collections/users/collection';
import { Sequences } from '../server/collections/sequences/collection';
import { sequenceGetAllPostIDs } from '../lib/collections/sequences/helpers';
import { Collections } from '../server/collections/collections/collection';
import { collectionGetAllPostIDs } from '../lib/collections/collections/helpers';
import findIndex from 'lodash/findIndex';
import * as _ from 'underscore';
import { runSqlQuery } from '../server/sql/sqlClient';
import { updateMutator } from "./vulcan-lib/mutators";
import gql from 'graphql-tag';

// Given a user ID, a post ID which the user has just read, and a sequence ID
// that they read it in the context of, determine whether this means they have
// a partially-read sequence, and update their user object to reflect this
// status.
export const updateSequenceReadStatusForPostRead = async (userId: string, postId: string, sequenceId: string, context: ResolverContext) => {
  const user = await context.loaders.Users.load(userId);
  if (!user) throw Error(`Can't find user with ID: ${userId}, ${postId}, ${sequenceId}`)
  const postIDs = await sequenceGetAllPostIDs(sequenceId, context);
  const postReadStatuses = await postsToReadStatuses(user, postIDs);
  const anyUnread = _.some(postIDs, (postID: string) => !postReadStatuses[postID]);
  const sequence = await Sequences.findOne({_id: sequenceId});
  const collection = sequence?.canonicalCollectionSlug ? await Collections.findOne({slug: sequence.canonicalCollectionSlug}) : null;
  const now = new Date();
  
  const partiallyReadMinusThis = user.partiallyReadSequences?.filter(
    partiallyRead => partiallyRead.sequenceId !== sequenceId
      && (!collection || partiallyRead.collectionId !== collection._id)) || [];
  
  // Any unread posts in the sequence?
  if (anyUnread) {
    // First unread post. Relies on the fact that postIDs is sorted in sequence
    // reading order.
    const nextPostIndex = findIndex(postIDs, (postID: string)=>!postReadStatuses[postID]);
    const nextPostId = postIDs[nextPostIndex];
    
    const sequenceReadStatus = {
      sequenceId: sequenceId,
      lastReadPostId: postId,
      nextPostId: nextPostId,
      numRead: _.filter(postIDs, (id: string)=>!!postReadStatuses[id]).length,
      numTotal: postIDs.length,
      lastReadTime: now,
    };
    
    // Generate a new partiallyReadSequences list by filtering out any previous
    // entry for this sequence or for the collection that cotntains it, and
    // adding a new entry for this sequence to the end.
    const newPartiallyReadSequences = [...partiallyReadMinusThis, sequenceReadStatus];
    await setUserPartiallyReadSequences(userId, newPartiallyReadSequences);
    return;
  }
  
  // User is finished with this sequence. If the sequence had a canonical
  // collection (ie, R:A-Z, Codex or HPMoR), find the first unread post in
  // the whole collection. If they've read everything in the collection, or
  // it isn't part of a collection, they're done.
  if (collection) {
    const collectionPostIDs = await collectionGetAllPostIDs(collection._id, context);
    const collectionPostReadStatuses = await postsToReadStatuses(user, collectionPostIDs);
    const collectionAnyUnread = _.some(collectionPostIDs, (postID: string) => !collectionPostReadStatuses[postID]);
    
    if (collectionAnyUnread) {
      const nextPostIndex = findIndex(collectionPostIDs, (postID: string)=>!collectionPostReadStatuses[postID]);
      const nextPostId = collectionPostIDs[nextPostIndex];
      
      const collectionReadStatus = {
        collectionId: collection._id,
        lastReadPostId: postId,
        nextPostId: nextPostId,
        numRead: _.filter(collectionPostIDs, (id: string)=>!!collectionPostReadStatuses[id]).length,
        numTotal: collectionPostIDs.length,
        lastReadTime: now,
      };
      
      // Generate a new partiallyReadSequences, filtering out the sequence that
      // was just finished and any other entry for this same collection.
      //
      // Minor oddity: It's possible to end up with the partially-read
      // list containing both a sequence and the collection that contains it,
      // if you are part-way through sequence A, and finish sequence B, A and
      // B in the same collection.
      const newPartiallyReadSequences = [...partiallyReadMinusThis, collectionReadStatus];
      await setUserPartiallyReadSequences(userId, newPartiallyReadSequences);
      return;
    }
  }
  
  // Done reading! If the user previously had a partiallyReadSequences entry
  // for this sequence, remove it and update the user object.
  if (user.partiallyReadSequences?.some(s=>s.sequenceId === sequenceId)) {
    await setUserPartiallyReadSequences(userId, partiallyReadMinusThis);
  }
}

export const setUserPartiallyReadSequences = async (userId: string, newPartiallyReadSequences: AnyBecauseTodo) => {
  await updateMutator({
    collection: Users,
    documentId: userId,
    set: {
      partiallyReadSequences: newPartiallyReadSequences
    },
    unset: {},
    validate: false,
  });
}

const getReadPostIds = async (user: DbUser, postIDs: Array<string>): Promise<string[]> => {
  const result = await runSqlQuery(`
    -- partiallyReadSequences.getReadPostIds
    SELECT "Posts"."_id" FROM "Posts"
    JOIN "ReadStatuses" ON
      "Posts"."_id" = "ReadStatuses"."postId" AND
      "ReadStatuses"."isRead" = TRUE AND
      "ReadStatuses"."userId" = $1
    WHERE "Posts"."_id" IN ( $2:csv )
  `, [user._id, postIDs], "read");
  return result.map(({_id}) => _id);
}

// Given a user and an array of post IDs, return a dictionary from
// postID=>bool, true if the user has read the post and false otherwise.
const postsToReadStatuses = async (user: DbUser, postIds: Array<string>) => {
  const readPostIds = await getReadPostIds(user, postIds);
  const resultDict: Partial<Record<string,boolean>> = {};
  for (const postID of postIds)
    resultDict[postID] = false;
  for (const readPostId of readPostIds)
    resultDict[readPostId] = true;
  return resultDict;
}

export const partiallyReadSequencesTypeDefs = gql`
  extend type Mutation {
    updateContinueReading(sequenceId: String!, postId: String!): Boolean
  }
`
export const partiallyReadSequencesMutations = {
  async updateContinueReading(root: void, {sequenceId, postId}: {sequenceId: string, postId: string}, context: ResolverContext) {
    const { currentUser } = context;
    if (!currentUser) {
      // If not logged in, this is ignored, but is not an error (in future
      // versions it might associate with a clientID rather than a userID).
      return null;
    }
    
    await updateSequenceReadStatusForPostRead(currentUser._id, postId, sequenceId, context);
    
    return true;
  }
}
