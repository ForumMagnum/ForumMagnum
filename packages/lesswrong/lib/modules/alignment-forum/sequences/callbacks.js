import Sequences from '../../../collections/sequences/collection.js';
import { addCallback } from 'meteor/vulcan:core';
import Users from "meteor/vulcan:users";

async function SequenceMoveToAFUpdatesAFPostCount (sequence) {
  const afSequenceCount = Sequences.find({
    userId:sequence.userId,
    af: true,
    draft: false
  }).count()
  const afSequenceDraftCount = Sequences.find({
    userId:sequence.userId,
    af: true,
    draft: true
  }).count()
  Users.update({_id:sequence.userId}, {$set: {
    afSequenceCount: afSequenceCount,
    afSequenceDraftCount: afSequenceDraftCount
  }})
}

addCallback("sequences.edit.async", SequenceMoveToAFUpdatesAFPostCount);
addCallback("sequences.new.async", SequenceMoveToAFUpdatesAFPostCount);
