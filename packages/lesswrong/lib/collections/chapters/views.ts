import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  interface ChaptersViewTerms extends ViewTermsBase {
    view: ChaptersViewName
    sequenceId?: string
  }
}

function SequenceChapters(terms: ChaptersViewTerms) {
  return {
    selector: {sequenceId: terms.sequenceId},
    options: {sort: {number: 1, createdAt: 1}, limit: terms.limit || 20},
  };
};

export const ChaptersViews = new CollectionViewSet('Chapters', {
  SequenceChapters
});
