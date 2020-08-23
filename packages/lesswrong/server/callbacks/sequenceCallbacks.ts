import { addCallback } from '../../lib/vulcan-lib';
import Chapters from '../../lib/collections/chapters/collection'
import Sequences, { makeEditableOptions } from '../../lib/collections/sequences/collection'
import { addEditableCallbacks } from '../editor/make_editable_callbacks';

function SequenceNewCreateChapter (sequence: DbSequence) {
  if (sequence._id && !sequence.chaptersDummy) {
    Chapters.insert({sequenceId:sequence._id})
  }
}

addCallback("sequences.new.async", SequenceNewCreateChapter);

addEditableCallbacks({collection: Sequences, options: makeEditableOptions})
