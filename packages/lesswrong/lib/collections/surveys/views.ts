import Surveys from "./collection";

declare global {
  interface SurveysViewTerms extends ViewTermsBase {
    view?: SurveysViewName
  }
}

Surveys.addView("surveysByCreatedAt", (_terms: SurveysViewTerms) => {
  return {
    options: {
      sort: {
        createdAt: -1,
        _id: 1,
      },
    },
  };
});
