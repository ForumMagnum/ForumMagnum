import Chapters from '../../lib/collections/chapters/collection'
import Sequences from '../../lib/collections/sequences/collection'
import { getCollectionHooks } from '../mutationCallbacks';

getCollectionHooks("Sequences").newAsync.add(function SequenceNewCreateChapter(sequence) {
  if (sequence._id) {
    Chapters.insert({sequenceId:sequence._id})
  }
});
