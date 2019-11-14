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

Tags.addView('tagBySlug', terms => {
  return {
    selector: {
      slug: terms.slug,
    },
  };
});

ensureIndex(Tags, {slug:1, deleted:1});
