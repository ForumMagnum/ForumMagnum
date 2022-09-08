import { TagFlags } from './collection';
import { ensureIndex } from '../../collectionIndexUtils';

declare global {
  interface TagFlagsViewTerms extends ViewTermsBase {
    view?: TagFlagsViewName
    userId?: string
  }
}

TagFlags.addView('allTagFlags', (terms: TagFlagsViewTerms) => {
  return {
    selector: {
      deleted: false,
    },
    options: {
      sort: {order: 1, name: -1},
    },
  };
});

ensureIndex(TagFlags, {deleted:1, order:1, name: 1});
