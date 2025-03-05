import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  interface CurationNoticesPageViewTerms {
    view: 'curationNoticesPage'
  }
  type CurationNoticesViewTerms = Omit<ViewTermsBase, 'view'> & (CurationNoticesPageViewTerms | {view?: undefined})
}

function curationNoticesPage() {
  return {
    selector: { deleted: false },
    options: { sort: { createdAt: -1 } }
  };
}

export const CurationNoticesViews = new CollectionViewSet('CurationNotices', {
  curationNoticesPage
});
