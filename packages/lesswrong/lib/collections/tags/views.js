import { Tags } from './collection.js';
import { ensureIndex } from '../../collectionUtils';

Tags.addDefaultView(terms => {
  return {
    selector: {
      deleted: false,
    },
  };
});

Tags.addView('allTagsAlphabetical', terms => {
  return {
    selector: {},
    options: {sort: {name: 1}}
  }
});

Tags.addView('tagByName', terms => {
  return {
    selector: {
      name: terms.name,
    },
  };
});

ensureIndex(Tags, {name:1, deleted:1});
