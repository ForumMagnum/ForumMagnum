import Spotlights from "./collection";

declare global {
  interface SpotlightsViewTerms extends ViewTermsBase {

  }
}

// will be common to all other view unless specific properties are overwritten
Spotlights.addDefaultView(function (terms: ConversationsViewTerms) {
  return {
    selector: {
      
    },
    options: {
      sort: {
        spotlightImageId: -1
      }
    },
  };
});