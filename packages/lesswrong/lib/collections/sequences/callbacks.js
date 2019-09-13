import { addCallback } from 'meteor/vulcan:core';
import Chapters from '../chapters/collection.js'
import Sequences, { makeEditableOptions } from './collection.js'
import { addEditableCallbacks } from '../../../server/editor/make_editable_callbacks.js';

function SequenceNewCreateChapter (sequence) {
  if (sequence._id && !sequence.chaptersDummy) {
    Chapters.insert({sequenceId:sequence._id})
  }
}

addCallback("sequences.new.async", SequenceNewCreateChapter);

addEditableCallbacks({collection: Sequences, options: makeEditableOptions})
