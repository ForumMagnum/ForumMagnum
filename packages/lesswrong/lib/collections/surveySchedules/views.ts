import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  interface SurveySchedulesViewTerms extends ViewTermsBase {
    view: SurveySchedulesViewName
  }
}

function surveySchedulesByCreatedAt(_terms: SurveySchedulesViewTerms) {
  return {
    options: {
      sort: {
        createdAt: -1,
        _id: 1,
      },
    },
  };
}

export const SurveySchedulesViews = new CollectionViewSet('SurveySchedules', {
  surveySchedulesByCreatedAt
});
