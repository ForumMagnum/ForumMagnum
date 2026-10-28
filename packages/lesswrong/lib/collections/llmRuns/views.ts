import { CollectionViewSet } from '@/lib/views/collectionViewSet';

declare global {
  interface LlmRunsViewTerms extends ViewTermsBase {
    view: LlmRunsViewName
  }
}

export const LlmRunsViews = new CollectionViewSet('LlmRuns', {});
