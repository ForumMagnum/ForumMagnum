import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  interface SurveysViewTerms extends ViewTermsBase {
    view: SurveysViewName
  }
}

function surveysByCreatedAt(_terms: SurveysViewTerms) {
  return {
    options: {
      sort: {
        createdAt: -1,
        _id: 1,
      },
    },
  };
}

export const SurveysViews = new CollectionViewSet('Surveys', {
  surveysByCreatedAt
});
