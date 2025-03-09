import Chapters from '../../server/collections/chapters/collection'
import { getCollectionHooks } from '../mutationCallbacks';

getCollectionHooks("Sequences").newAsync.add(function SequenceNewCreateChapter(sequence) {
  if (sequence._id) {
    void Chapters.rawInsert({sequenceId:sequence._id, postIds: []})
  }
});
