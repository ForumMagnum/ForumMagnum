import { CollectionViewSet } from '@/lib/views/collectionViewSet';

declare global {
  interface IframeWidgetSrcdocsViewTerms extends ViewTermsBase {
    view: IframeWidgetSrcdocsViewName
    // Add your view terms here
  }
}

// Define your view functions here

export const IframeWidgetSrcdocsViews = new CollectionViewSet('IframeWidgetSrcdocs', {
  // Add your view functions here
});
