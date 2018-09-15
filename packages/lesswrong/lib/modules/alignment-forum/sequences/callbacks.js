import Sequences from '../../../collections/sequences/collection.js';
import { addCallback } from 'meteor/vulcan:core';
import Users from "meteor/vulcan:users";

async function SequenceMoveToAFUpdatesAFPostCount (sequence, oldSequence) {
  if (!oldSequence || (sequence.af !== oldSequence.af)) {
    const afSequenceCount = Sequences.find({userId:sequence.userId, af: true}).count()
    Users.update({_id:sequence.userId}, {$set: {afSequenceCount: afSequenceCount}})
  }
}

addCallback("sequence.edit.async", SequenceMoveToAFUpdatesAFPostCount);
addCallback("sequence.new.async", SequenceMoveToAFUpdatesAFPostCount);
