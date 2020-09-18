import { TagFlags } from './collection';
import { ensureIndex } from '../../collectionUtils';

TagFlags.addView('allTagFlags', terms => {
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
