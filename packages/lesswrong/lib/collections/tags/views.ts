import { viewFieldAllowAny, jsonArrayContainsSelector } from '@/lib/utils/viewConstants';
import { userIsAdminOrMod } from '@/lib/vulcan-users/permissions';
import { hasWikiLenses } from '@/lib/betas';
import { CollectionViewSet } from '../../../lib/views/collectionViewSet';
import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';

declare global {
  interface TagsViewTerms extends ViewTermsBase {
    view: TagsViewName | 'default'
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
function defaultView(terms: TagsViewTerms, _: ApolloClient<NormalizedCacheObject>, context?: ResolverContext) {
  const currentUser = context?.currentUser ?? null;

  return {
    selector: {
      wikiOnly: false,
      ...(terms.excludedTagIds ? { _id: {$nin: terms.excludedTagIds} } : {}),
      ...(!userIsAdminOrMod(currentUser) ? { deleted: false, adminOnly: false } : {}),
    }
  };
}

function tagsByTagIds(terms: TagsViewTerms) {
  return {
    selector: {_id: {$in: terms.tagIds}}
  };
}

function allTagsAlphabetical(terms: TagsViewTerms) {
  return {
    selector: {},
    options: {sort: {name: 1}}
  }
}

function userTags(terms: TagsViewTerms) {
  return {
    selector: {
      userId: terms.userId,
      adminOnly: viewFieldAllowAny,
      wikiOnly: viewFieldAllowAny
    },
    options: {sort: {createdAt: -1}},
  }
}

function currentUserSubforums(terms: TagsViewTerms, _: ApolloClient<NormalizedCacheObject>, context?: ResolverContext) {
  return {
    selector: {
      // Always show core subforums
      $or: [{_id: {$in: context?.currentUser?.profileTagIds ?? []}}, {core: true}],
      isSubforum: true
    },
    options: {sort: {createdAt: -1}},
  }
}

function allPagesByNewest(terms: TagsViewTerms) {
  return {
    selector: {
      wikiOnly: viewFieldAllowAny
    },
    options: {sort: {createdAt: -1}},
  }
}

function allTagsHierarchical(terms: TagsViewTerms) {
  const selector = terms.wikiGrade !== undefined && parseInt(terms.wikiGrade)
    ? {wikiGrade: parseInt(terms.wikiGrade)}
    : {}
  return {
    selector,
    options: {sort: {defaultOrder: -1, postCount: -1, name: 1}}
  }
}

function tagBySlug(terms: TagsViewTerms) {
  return {
    selector: {
      $or: [{slug: terms.slug}, {oldSlugs: terms.slug}],
      adminOnly: viewFieldAllowAny,
      wikiOnly: viewFieldAllowAny,
    },
  };
}

function tagsBySlugs(terms: TagsViewTerms) {
  return {
    selector: {
      $or: [{slug: {$in: terms.slugs}}, {oldSlugs: {$in: terms.slugs}}],
      wikiOnly: viewFieldAllowAny,
      deleted: false,
    },
  };
}

function coreTags(terms: TagsViewTerms) {
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
}

function postTypeTags(terms: TagsViewTerms) {
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
}

function coreAndSubforumTags(terms: TagsViewTerms) {
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
}

function newTags(terms: TagsViewTerms) {
  return {
    options: {
      sort: {
        createdAt: -1
      }
    }
  }
}

function unreviewedTags(terms: TagsViewTerms) {
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
}

function suggestedFilterTags(terms: TagsViewTerms) {
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
}

function allLWWikiTags(terms: TagsViewTerms) {
  return {
    selector: {
      wikiOnly: viewFieldAllowAny,
      lesswrongWikiImportSlug: {$exists: true},
    }
  }
}

function unprocessedLWWikiTags(terms: TagsViewTerms) {
  return {
    selector: {
      wikiOnly: viewFieldAllowAny,
      tagFlagsIds: 'B5nzngQDDci4syEzD',
    }
  }
}

function tagsByTagFlag(terms: TagsViewTerms) {
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
}

function allPublicTags(terms: TagsViewTerms) {
  return {
    selector: {
      adminOnly: viewFieldAllowAny,
      wikiOnly: viewFieldAllowAny
    },
    options: {sort: {name: 1}}
  }
}

function allArbitalTags(terms: TagsViewTerms) {
  return {
    selector: {
      wikiOnly: viewFieldAllowAny,
      //legacyData contains an arbitalPageId and is not deleted
      'legacyData.arbitalPageId': {$exists: true},
      deleted: false,
    }
  }
}

const pingbackSelector = (terms: TagsViewTerms) => hasWikiLenses
  ? jsonArrayContainsSelector("pingbacks.Tags", terms.tagId)
  : {
    $or: [
      jsonArrayContainsSelector("pingbacks.Tags", terms.tagId),
      jsonArrayContainsSelector("pingbacks.MultiDocuments", terms.tagId),
    ]
  }

function pingbackWikiPages(terms: TagsViewTerms) {
  return {
    selector: {
      ...pingbackSelector(terms),
      wikiOnly: viewFieldAllowAny,
    },
  }
}

// Create the CollectionViewSet instance
export const TagsViews = new CollectionViewSet('Tags', {
  tagsByTagIds,
  allTagsAlphabetical,
  userTags,
  currentUserSubforums,
  allPagesByNewest,
  allTagsHierarchical,
  tagBySlug,
  tagsBySlugs,
  coreTags,
  postTypeTags,
  coreAndSubforumTags,
  newTags,
  unreviewedTags,
  suggestedFilterTags,
  allLWWikiTags,
  unprocessedLWWikiTags,
  tagsByTagFlag,
  allPublicTags,
  allArbitalTags,
  pingbackWikiPages
}, defaultView);
