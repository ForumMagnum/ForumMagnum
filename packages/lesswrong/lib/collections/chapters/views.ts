import Chapters from './collection';
import { ensureIndex } from '../../collectionUtils';

Chapters.addView("SequenceChapters", function (terms) {
  return {
    selector: {sequenceId: terms.sequenceId},
    options: {sort: {number: 1}, limit: terms.limit || 20},
  };
});
ensureIndex(Chapters, { sequenceId: 1, number: 1 })
