import SurveySchedules from "./collection";

declare global {
  interface SurveySchedulesViewTerms extends ViewTermsBase {
    view?: SurveySchedulesViewName
  }
}

SurveySchedules.addView("surveySchedulesByCreatedAt", (_terms: SurveySchedulesViewTerms) => {
  return {
    options: {
      sort: {
        createdAt: -1,
        _id: 1,
      },
    },
  };
});
