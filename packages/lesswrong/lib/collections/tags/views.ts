import { Tags } from './collection';
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

Tags.addView('coreTags', terms => {
  return {
    selector: {
      core: true,
    },
    options: {
      sort: {
        name: 1
      }
    },
  }
});

Tags.addView('suggestedFilterTags', terms => {
  return {
    selector: {
      suggestedAsFilter: true,
    },
    options: {
      sort: {
        name: 1
      }
    },
  }
});

ensureIndex(Tags, {slug:1, deleted:1});
ensureIndex(Tags, {core:1, deleted:1});
ensureIndex(Tags, {suggestedAsFilter:1, deleted:1});
