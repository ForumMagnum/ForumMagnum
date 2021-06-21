import Chapters from '../../lib/collections/chapters/collection'
import { getCollectionHooks } from '../mutationCallbacks';

getCollectionHooks("Sequences").newAsync.add(async function SequenceNewCreateChapter(sequence) {
  if (sequence._id) {
    await Chapters.insert({sequenceId:sequence._id})
  }
});
