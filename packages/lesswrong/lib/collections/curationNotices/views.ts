import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  interface CurationNoticesPageViewTerms {
    view: 'curationNoticesPage'
  }
  interface CurationNoticesPostViewTerms {
    view: 'curationNoticesPostView'
    postId: string
  }
  type CurationNoticesViewTerms = Omit<ViewTermsBase, 'view'> & (CurationNoticesPageViewTerms | CurationNoticesPostViewTerms | {view?: undefined}) 
}

function curationNoticesPage() {
  return {
    selector: { deleted: false },
    options: { sort: { createdAt: -1 } }
  };
}

function curationNoticesPostView(terms: CurationNoticesPostViewTerms) {
  return {
    selector: { postId: terms.postId, deleted: false },
    options: { sort: { createdAt: -1 } }
  };
}

export const CurationNoticesViews = new CollectionViewSet('CurationNotices', {
  curationNoticesPage,
  curationNoticesPostView
});
