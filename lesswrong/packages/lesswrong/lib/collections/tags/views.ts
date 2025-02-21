import { Tags } from './collection';
import { ensureCustomPgIndex, ensureIndex } from '../../collectionIndexUtils';
import { viewFieldAllowAny } from '../../vulcan-lib/collections';
import { userIsAdminOrMod } from '../../vulcan-users/permissions';
import { jsonArrayContainsSelector } from '@/lib/utils/viewUtils';
import { hasWikiLenses } from '@/lib/betas';

declare global {
  interface TagsViewTerms extends ViewTermsBase {
    view?: TagsViewName
    userId?: string
    wikiGrade?: string
    slug?: string
    slugs?: string[]
    tagFlagId?: string
    parentTagId?: string
    tagId?: string
    tagIds?: string[]
    excludedTagIds?: string[]
  }
}

/**
 * Default view. When changing this, also update getViewableTagsSelector.
 */
Tags.addDefaultView((terms: TagsViewTerms, _, context?: ResolverContext) => {
  const currentUser = context?.currentUser ?? null;

  return {
    selector: {
      wikiOnly: false,
      ...(terms.excludedTagIds ? { _id: {$nin: terms.excludedTagIds} } : {}),
      ...(!userIsAdminOrMod(currentUser) ? { deleted: false, adminOnly: false } : {}),
    }
  };
});
ensureIndex(Tags, {deleted:1, adminOnly:1});

Tags.addView("tagsByTagIds", (terms: TagsViewTerms) => {
  return {
    selector: {_id: {$in: terms.tagIds}}
  };
});

Tags.addView('allTagsAlphabetical', (terms: TagsViewTerms) => {
  return {
    selector: {},
    options: {sort: {name: 1}}
  }
});
ensureIndex(Tags, {deleted:1, adminOnly:1, name: 1});

Tags.addView("userTags", (terms: TagsViewTerms) => {
  return {
    selector: {
      userId: terms.userId,
      adminOnly: viewFieldAllowAny,
      wikiOnly: viewFieldAllowAny
    },
    options: {sort: {createdAt: -1}},
  }
});
ensureIndex(Tags, {deleted: 1, userId: 1, createdAt: 1});

Tags.addView("currentUserSubforums", (terms: TagsViewTerms, _, context?: ResolverContext) => {
  return {
    selector: {
      // Always show core subforums
      $or: [{_id: {$in: context?.currentUser?.profileTagIds ?? []}}, {core: true}],
      isSubforum: true
    },
    options: {sort: {createdAt: -1}},
  }
});

Tags.addView('allPagesByNewest', (terms: TagsViewTerms) => {
  return {
    selector: {
      wikiOnly: viewFieldAllowAny
    },
    options: {sort: {createdAt: -1}},
  }
});
ensureIndex(Tags, {deleted:1, adminOnly:1, wikiOnly: 1, createdAt: 1});

Tags.addView('allTagsHierarchical', (terms: TagsViewTerms) => {
  const selector = terms.wikiGrade !== undefined && parseInt(terms.wikiGrade)
    ? {wikiGrade: parseInt(terms.wikiGrade)}
    : {}
  return {
    selector,
    options: {sort: {defaultOrder: -1, postCount: -1, name: 1}}
  }
});

ensureIndex(Tags, {deleted:1, adminOnly:1, wikiGrade: 1, defaultOrder: 1, postCount: 1, name: 1});

Tags.addView('tagBySlug', (terms: TagsViewTerms) => {
  return {
    selector: {
      $or: [{slug: terms.slug}, {oldSlugs: terms.slug}],
      adminOnly: viewFieldAllowAny,
      wikiOnly: viewFieldAllowAny,
      // TODO: remove this after cleaning up db from Arbital imports leaving many deleted tags with the same slug
      deleted: false,
    },
  };
});
ensureIndex(Tags, {deleted: 1, slug:1, oldSlugs: 1});

Tags.addView('tagsBySlugs', (terms: TagsViewTerms) => {
  return {
    selector: {
      $or: [{slug: {$in: terms.slugs}}, {oldSlugs: {$in: terms.slugs}}],
      wikiOnly: viewFieldAllowAny,
      deleted: false,
    },
  };
});

Tags.addView('coreTags', (terms: TagsViewTerms) => {
  return {
    selector: {
      core: true,
      adminOnly: viewFieldAllowAny
    },
    options: {
      sort: {
        defaultOrder: -1,
        name: 1
      }
    },
  }
});
ensureIndex(Tags, {deleted: 1, core:1, name: 1});

Tags.addView('postTypeTags', (terms: TagsViewTerms) => {
  return {
    selector: {
      isPostType: true,
      adminOnly: viewFieldAllowAny
    },
    options: {
      sort: {
        defaultOrder: -1,
        name: 1
      }
    },
  }
});
ensureIndex(Tags, {deleted: 1, isPostType:1, name: 1});

Tags.addView('coreAndSubforumTags', (terms: TagsViewTerms) => {
  return {
    selector: {
      $or: [{core: true}, {isSubforum: true}],
      adminOnly: viewFieldAllowAny
    },
    options: {
      sort: {
        defaultOrder: -1,
        name: 1
      }
    },
  }
});

Tags.addView('newTags', (terms: TagsViewTerms) => {
  return {
    options: {
      sort: {
        createdAt: -1
      }
    }
  }
})
ensureIndex(Tags, {deleted: 1, createdAt: 1});

Tags.addView('unreviewedTags', (terms: TagsViewTerms) => {
  return {
    selector: {
      needsReview: true,
      deleted: false
    },
    options: {
      sort: {
        createdAt: 1
      }
    },
  }
});
ensureIndex(Tags, {deleted: 1, needsReview: 1, createdAt: 1});

Tags.addView('suggestedFilterTags', (terms: TagsViewTerms) => {
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

Tags.addView('allLWWikiTags', (terms: TagsViewTerms) => {
  return {
    selector: {
      wikiOnly: viewFieldAllowAny,
      lesswrongWikiImportSlug: {$exists: true},
    }
  }
});

ensureIndex(Tags, {deleted: 1, adminOnly: 1, lesswrongWikiImportSlug: 1});

Tags.addView('unprocessedLWWikiTags', (terms: TagsViewTerms) => {
  return {
    selector: {
      wikiOnly: viewFieldAllowAny,
      tagFlagsIds: 'B5nzngQDDci4syEzD',
    }
  }
});

ensureIndex(Tags, {deleted: 1, adminOnly: 1, tagFlagsIds: 1});


Tags.addView('tagsByTagFlag', (terms: TagsViewTerms) => {
  return {
    selector: terms.tagFlagId ?
    {
      tagFlagsIds: terms.tagFlagId,
      wikiOnly: viewFieldAllowAny
    } :
    {
      tagFlagsIds: {$exists: true, $gt: []},
      wikiOnly: viewFieldAllowAny
    },
    options: {sort: {createdAt: -1}}
  }
});

Tags.addView('allPublicTags', (terms: TagsViewTerms) => {
  return {
    selector: {
      adminOnly: viewFieldAllowAny,
      wikiOnly: viewFieldAllowAny
    },
    options: {sort: {name: 1}}
  }
});

ensureIndex(Tags, {name: 1});

Tags.addView('allArbitalTags', (terms: TagsViewTerms) => {
  return {
    selector: {
      wikiOnly: viewFieldAllowAny,
      //legacyData contains an arbitalPageId and is not deleted
      'legacyData.arbitalPageId': {$exists: true},
      deleted: false,
    }
  }
});

// TODO: switch this to a custom index, maybe a GIN index?
ensureIndex(Tags, {name: 1, "legacyData.arbitalPageId": 1});

const pingbackSelector = (terms: TagsViewTerms) => hasWikiLenses
  ? jsonArrayContainsSelector("pingbacks.Tags", terms.tagId)
  : {
    $or: [
      jsonArrayContainsSelector("pingbacks.Tags", terms.tagId),
      jsonArrayContainsSelector("pingbacks.MultiDocuments", terms.tagId),
    ]
  }

Tags.addView("pingbackWikiPages", (terms: TagsViewTerms) => {
  return {
    selector: {
      ...pingbackSelector(terms),
      wikiOnly: viewFieldAllowAny,
    },
  }
});
void ensureCustomPgIndex(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tags_pingbacks ON "Tags" USING gin(pingbacks);`);

// Used in subTags resolver
ensureIndex(Tags, {parentTagId: 1});
