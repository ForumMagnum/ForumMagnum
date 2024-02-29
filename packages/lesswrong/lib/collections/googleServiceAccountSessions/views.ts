import GoogleServiceAccountSessions from "./collection"

declare global {
  interface GoogleServiceAccountSessionsViewTerms extends ViewTermsBase {
  }
}

GoogleServiceAccountSessions.addDefaultView((terms: GoogleServiceAccountSessionsViewTerms) => {
  return {
    selector: {
      active: true
    }
  };
});
