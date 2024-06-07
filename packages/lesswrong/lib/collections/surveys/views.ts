import Surveys from "./collection"

declare global {
  interface SurveysViewTerms extends ViewTermsBase {
    view?: SurveysViewName
  }
}

Surveys.addView("surveysByCreatedAt", function (_terms: SurveysViewTerms) {
  return {
    selector: {},
    options: {
      sort: {
        createdAt: -1,
        _id: 1,
      },
    },
  };
});
