import { addCallback, editMutation } from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';
import Sequences from '../lib/collections/sequences/collection.js';
import Posts from '../lib/collections/posts/collection.js';
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
  
  if (anyUnread) {
    // First unread post. Relies on the fact that postIDs is sorted in sequence
    // reading order.
    const nextPostIndex = findIndex(postIDs, postID=>!postReadStatuses[postID]);
    const nextPostId = postIDs[nextPostIndex];
    
    const sequenceReadStatus = {
      sequenceId: sequenceId,
      lastReadPostId: postId,
      nextPostId: nextPostId,
    };
    
    // Generate a new partiallyReadSequences list by filtering out any previous
    // entry for this sequence, and adding a new entry for this sequence to the
    // end.
    let newPartiallyReadSequences = _.filter(user.partiallyReadSequences,
      partiallyReadSequence=>partiallyReadSequence.sequenceId !== sequenceId);
    newPartiallyReadSequences.push(sequenceReadStatus);
    
    // Update the user object
    editMutation({
      collection: Users,
      documentId: userId,
      set: {
        partiallyReadSequences: newPartiallyReadSequences
      },
      unset: {},
      validate: false,
    });
  } else {
    // If the user previously had a partiallyReadSequences entry for this
    // sequence, remove it and update the user object.
    if (_.some(user.partiallyReadSequences, s=>s.sequenceId === sequenceId)) {
      let newPartiallyReadSequences = _.filter(user.partiallyReadSequences,
        partiallyReadSequence=>partiallyReadSequence.sequenceId !== sequenceId);
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
  }
}

const EventUpdatePartialReadStatusCallback = async (event) => {
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