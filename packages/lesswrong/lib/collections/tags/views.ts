import { Tags } from './collection';
import { ensureIndex } from '../../collectionUtils';
import { viewFieldAllowAny } from '../../vulcan-lib';

Tags.addDefaultView(terms => {
  return {
    selector: {
      deleted: false,
      adminOnly: false
    },
  };
});

Tags.addView('allTagsAlphabetical', terms => {
  return {
    selector: {},
    options: {sort: {name: 1}}
  }
});

Tags.addView('allTagsHierarchical', terms => {
  return {
    selector: {},
    options: {sort: {defaultOrder: -1, postCount: -1, name: 1}}
  }
});

Tags.addView('tagBySlug', terms => {
  return {
    selector: {
      $or: [{slug: terms.slug}, {oldSlugs: terms.slug}],
      adminOnly: viewFieldAllowAny
    },
  };
});

Tags.addView('coreTags', terms => {
  return {
    selector: {
      core: true,
      adminOnly: viewFieldAllowAny
    },
    options: {
      sort: {
        name: 1
      }
    },
  }
});


Tags.addView('unreviewedTags', terms => {
  return {
    selector: {
      needsReview: true
    },
    options: {
      sort: {
        createdAt: 1
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
        defaultOrder: -1,
        name: 1
      }
    },
  }
});

ensureIndex(Tags, {slug:1, deleted:1});
ensureIndex(Tags, {oldSlugs:1, deleted:1});
ensureIndex(Tags, {core:1, deleted:1});
ensureIndex(Tags, {suggestedAsFilter:1, deleted:1});
