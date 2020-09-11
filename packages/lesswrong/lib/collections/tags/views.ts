import { Tags } from './collection';
import { ensureIndex } from '../../collectionUtils';
import { viewFieldAllowAny } from '../../vulcan-lib';

Tags.addDefaultView(terms => {
  return {
    selector: {
      deleted: false,
      adminOnly: false,
      wikiOnly: false
    },
  };
});
ensureIndex(Tags, {deleted:1, adminOnly:1});

Tags.addView('allTagsAlphabetical', terms => {
  return {
    selector: {},
    options: {sort: {name: 1}}
  }
});
ensureIndex(Tags, {deleted:1, adminOnly:1, name: 1});

Tags.addView('allTagsHierarchical', terms => {
  const selector = parseInt(terms?.wikiGrade) ? {wikiGrade: parseInt(terms?.wikiGrade)} : {}
  return {
    selector,
    options: {sort: {defaultOrder: -1, postCount: -1, name: 1}}
  }
});

ensureIndex(Tags, {deleted:1, adminOnly:1, wikiGrade: 1, defaultOrder: 1, postCount: 1, name: 1});

Tags.addView('tagBySlug', terms => {
  return {
    selector: {
      $or: [{slug: terms.slug}, {oldSlugs: terms.slug}],
      adminOnly: viewFieldAllowAny,
      wikiOnly: viewFieldAllowAny
    },
  };
});
ensureIndex(Tags, {deleted: 1, slug:1, oldSlugs: 1});

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
ensureIndex(Tags, {deleted: 1, core:1, name: 1});


Tags.addView('newTags', terms => {
  return {
    options: {
      sort: {
        createdAt: -1
      }
    }
  }
})
ensureIndex(Tags, {deleted: 1, createdAt: 1});

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
ensureIndex(Tags, {deleted: 1, needsReview: 1, createdAt: 1});

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

ensureIndex(Tags, {deleted: 1, adminOnly: 1, suggestedAsFilter: 1, defaultOrder: 1, name: 1});

Tags.addView('allLWWikiTags', terms => {
  return {
    selector: {
      wikiOnly: viewFieldAllowAny,
      lesswrongWikiImportSlug: {$exists: true},
    }
  }
});

ensureIndex(Tags, {deleted: 1, adminOnly: 1, lesswrongWikiImportSlug: 1});

Tags.addView('processedLWWikiTags', terms => {
  return {
    selector: {
      wikiOnly: viewFieldAllowAny, 
      lesswrongWikiImportCompleted: true,
    }
  }
});

ensureIndex(Tags, {deleted: 1, adminOnly: 1, lesswrongWikiImportCompleted: 1});