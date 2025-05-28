import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  interface GoogleServiceAccountSessionsViewTerms extends ViewTermsBase {
    view: 'default' | undefined,
  }
}

function defaultView(terms: GoogleServiceAccountSessionsViewTerms) {
  return {
    selector: {
      active: true
    }
  };
}

export const GoogleServiceAccountSessionsViews = new CollectionViewSet(
  'GoogleServiceAccountSessions',
  {},
  defaultView
);
