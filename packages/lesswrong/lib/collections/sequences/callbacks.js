import { addCallback } from 'meteor/vulcan:core';
import Chapters from '../chapters/collection.js'
import Sequences, { makeEditableOptions } from './collection.js'
import Users from "meteor/vulcan:users";
import { addEditableCallbacks } from '../../../server/editor/make_editable_callbacks.js';

function SequenceNewCreateChapter (sequence) {
  if (sequence._id && !sequence.chaptersDummy) {
    Chapters.insert({sequenceId:sequence._id})
  }
}

addCallback("sequences.new.async", SequenceNewCreateChapter);

function UpdateUserSequenceCount (sequence) {
  if (sequence.userId) {
    const sequences = Sequences.find({
      userId: sequence.userId,
      draft: false,
      isDeleted: false
    }).fetch()
    const drafts = Sequences.find({
      userId: sequence.userId,
      draft: true,
      isDeleted: false
    }).fetch()
    Users.update(sequence.userId, {$set: {
      'sequenceCount': sequences.length,
      'sequenceDraftCount': drafts.length
    }})
  }
}
addCallback("sequences.new.async", UpdateUserSequenceCount);
addCallback("sequences.edit.async", UpdateUserSequenceCount);

addEditableCallbacks({collection: Sequences, options: makeEditableOptions})