import { ensureIndex } from '../../collectionIndexUtils';
import CurationNotices from './collection';

declare global {
  interface CurationNoticesPageViewTerms {
    view: 'curationNoticesPage'
  }
  type CurationNoticesViewTerms = Omit<ViewTermsBase, 'view'> & (CurationNoticesPageViewTerms | {view?: undefined})
}

CurationNotices.addView('curationNoticesPage', function () {
  return {
    selector: { deleted: false },
    options: { sort: { createdAt: -1 } }
  };
})
