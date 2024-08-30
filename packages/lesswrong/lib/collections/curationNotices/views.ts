import { ensureIndex } from '../../collectionIndexUtils';
import CurationNotices from './collection';

declare global {
  interface CurationNoticesTerms extends ViewTermsBase {

  }
}

CurationNotices.addView('curationNoticesPage', function () {
  return {
    selector: { deleted: false },
    options: { sort: { createdAt: -1 } }
  };
})
