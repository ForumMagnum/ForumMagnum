import Chapters from '../../lib/collections/chapters/collection'
import { getCollectionHooks } from '../mutationCallbacks';

getCollectionHooks("Sequences").newAsync.add(function SequenceNewCreateChapter(sequence) {
  if (sequence._id) {
    Chapters.rawInsert({sequenceId:sequence._id})
  }
});
