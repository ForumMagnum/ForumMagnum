import Chapters from './collection';
import { ensureIndex } from '../../collectionIndexUtils';

declare global {
  interface ChaptersViewTerms extends ViewTermsBase {
    view?: ChaptersViewName
    sequenceId?: string
  }
}

Chapters.addView("SequenceChapters", function (terms: ChaptersViewTerms) {
  return {
    selector: {sequenceId: terms.sequenceId},
    options: {sort: {number: 1, createdAt: 1}, limit: terms.limit || 20},
  };
});
ensureIndex(Chapters, { sequenceId: 1, number: 1 })
