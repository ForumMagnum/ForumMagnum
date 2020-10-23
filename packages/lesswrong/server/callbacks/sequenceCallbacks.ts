import Chapters from '../../lib/collections/chapters/collection'
import Sequences, { makeEditableOptions } from '../../lib/collections/sequences/collection'
import { addEditableCallbacks } from '../editor/make_editable_callbacks';
import { getCollectionHooks } from '../mutationCallbacks';

getCollectionHooks("Sequences").newAsync.add(function SequenceNewCreateChapter(sequence) {
  if (sequence._id && !sequence.chaptersDummy) {
    Chapters.insert({sequenceId:sequence._id})
  }
});

addEditableCallbacks({collection: Sequences, options: makeEditableOptions})
