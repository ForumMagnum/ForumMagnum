import { addCallback, editMutation } from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';
import Sequences from '../lib/collections/sequences/collection.js';
import Posts from '../lib/collections/posts/collection.js';
import Collections from '../lib/collections/collections/collection.js';
import findIndex from 'lodash/findIndex';


// Given a user ID, a post ID which the user has just read, and a sequence ID
// that they read it in the context of, determine whether this means they have
// a partially-read sequence, and update their user object to reflect this
// status.
const updateSequenceReadStatusForPostRead = async (userId, postId, sequenceId) => {
  const user = Users.getUser(userId);
  const postIDs = await Sequences.getAllPostIDs(sequenceId);
  const postReadStatuses = await postsToReadStatuses(user, postIDs);
  const anyUnread = _.some(postIDs, postID => !postReadStatuses[postID]);
  const sequence = await Sequences.findOne({_id: sequenceId});
  const collection = sequence.canonicalCollectionSlug ? await Collections.findOne({slug: sequence.canonicalCollectionSlug}) : null;
  const now = new Date();
  
  const partiallyReadMinusThis = _.filter(user.partiallyReadSequences,
    partiallyRead => partiallyRead.sequenceId !== sequenceId
      && (!collection || partiallyRead.collectionId !== collection._id));
  
  // Any unread posts in the sequence?
  if (anyUnread) {
    // First unread post. Relies on the fact that postIDs is sorted in sequence
    // reading order.
    const nextPostIndex = findIndex(postIDs, postID=>!postReadStatuses[postID]);
    const nextPostId = postIDs[nextPostIndex];
    
    const sequenceReadStatus = {
      sequenceId: sequenceId,
      lastReadPostId: postId,
      nextPostId: nextPostId,
      numRead: _.filter(postIDs, id=>postReadStatuses[id]).length,
      numTotal: postIDs.length,
      lastReadTime: now,
    };
    
    // Generate a new partiallyReadSequences list by filtering out any previous
    // entry for this sequence or for the collection that contains it, and
    // adding a new entry for this sequence to the end.
    const newPartiallyReadSequences = [...partiallyReadMinusThis, sequenceReadStatus];
    setUserPartiallyReadSequences(userId, newPartiallyReadSequences);
    return;
  }
  
  // User is finished with this sequence. If the sequence had a canonical
  // collection (ie, R:A-Z, Codex or HPMoR), find the first unread post in
  // the whole collection. If they've read everything in the collection, or
  // it isn't part of a collection, they're done.
  if (collection) {
    const collectionPostIDs = await Collections.getAllPostIDs(collection._id);
    const collectionPostReadStatuses = await postsToReadStatuses(user, collectionPostIDs);
    const collectionAnyUnread = _.some(collectionPostIDs, postID => !collectionPostReadStatuses[postID]);
    
    if (collectionAnyUnread) {
      const nextPostIndex = findIndex(collectionPostIDs, postID=>!collectionPostReadStatuses[postID]);
      const nextPostId = collectionPostIDs[nextPostIndex];
      
      const collectionReadStatus = {
        collectionId: collection._id,
        lastReadPostId: postId,
        nextPostId: nextPostId,
        numRead: _.filter(collectionPostIDs, id=>collectionPostReadStatuses[id]).length,
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
      setUserPartiallyReadSequences(userId, newPartiallyReadSequences);
      return;
    }
  }
  
  // Done reading! If the user previously had a partiallyReadSequences entry
  // for this sequence, remove it and update the user object.
  if (_.some(user.partiallyReadSequences, s=>s.sequenceId === sequenceId)) {
    setUserPartiallyReadSequences(userId, partiallyReadMinusThis);
  }
}

export const setUserPartiallyReadSequences = async (userId, newPartiallyReadSequences) => {
  editMutation({
    collection: Users,
    documentId: userId,
    set: {
      partiallyReadSequences: newPartiallyReadSequences
    },
    unset: {},
    validate: false,
  });
}

const EventUpdatePartialReadStatusCallback = (event) => {
  if (event.name === 'post-view' && event.properties.sequenceId) {
    // Deliberately lacks an await - this runs concurrently in the background
    updateSequenceReadStatusForPostRead(event.userId, event.documentId, event.properties.sequenceId);
  }
}

addCallback('lwevents.new.async', EventUpdatePartialReadStatusCallback);

// Given a user and an array of post IDs, return a dictionary from
// postID=>bool, true if the user has read the post and false otherwise.
const postsToReadStatuses = async (user, postIDs) => {
  const readPosts = await Posts.aggregate([
    { $match: {
      _id: {$in: postIDs}
    } },
    
    { $lookup: {
      from: "lwevents",
      let: { documentId: "$_id", },
      pipeline: [
        { $match: {
          name: "post-view",
          userId: user._id,
        } },
        { $match: { $expr: {
          $and: [
            {$eq: ["$documentId", "$$documentId"]},
          ]
        } } },
        { $limit: 1},
      ],
      as: "views",
    } },
    
    { $match: {
      "views": {$size: 1}
    } },
    
    { $project: {
      _id: 1
    } }
  ]).toArray();
  
  let resultDict = {};
  for (let postID of postIDs)
    resultDict[postID] = false;
  for (let readPost of readPosts)
    resultDict[readPost._id] = true;
  return resultDict;
}