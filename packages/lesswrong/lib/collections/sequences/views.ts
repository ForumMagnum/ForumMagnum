import { isAF, isLWorAF } from '../../instanceSettings';
import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  interface SequencesViewTerms extends ViewTermsBase {
    view: SequencesViewName | 'default'
    userId?: string
    sequenceIds?: string[]
    libraryTopics?: string[]
    curatedOnly?: boolean
    sortBy?: string
  }
}

/**
 * When changing this, also update getViewableSequencesSelector.
 */
function defaultView(terms: SequencesViewTerms) {
  const alignmentForum = isAF() ? {af: true} : {}
  let params = {
    selector: {
      hidden: false,
      ...(terms.sequenceIds && {_id: {$in: terms.sequenceIds}}),
      ...alignmentForum
    }
  }
  return params;
}

function userProfile(terms: SequencesViewTerms) {
  return {
    selector: {
      userId: terms.userId,
      isDeleted: false,
      draft: false,
      hideFromAuthorPage: false
    },
    options: {
      sort: {
        userProfileOrder: 1,
        createdAt: -1,
      }
    },
  };
}

function userProfilePrivate(terms: SequencesViewTerms) {
  return {
    selector: {
      userId: terms.userId,
      isDeleted: false,
      $or: [
        {draft: true},
        {hideFromAuthorPage: true}
      ]
    },
    options: {
      sort: {
        draft: -1,
        userProfileOrder: 1,
        createdAt: -1,
      }
    },
  };
}

function userProfileAll(terms: SequencesViewTerms) {
  return {
    selector: {
      userId: terms.userId,
      isDeleted: false
    },
    options: {
      sort: {
        draft: -1,
        hideFromAuthorPage: 1,
        userProfileOrder: 1,
        createdAt: -1
      }
    },
  };
}

function curatedSequences(terms: SequencesViewTerms) {
  return {
    selector: {
      userId: terms.userId,
      curatedOrder: {$exists: true},
      isDeleted: false,
      gridImageId: {$ne: null },
      draft: false,
    },
    options: {
      sort: {
        curatedOrder: -1,
        createdAt: -1
      }
    },
  };
}

function communitySequences(terms: SequencesViewTerms) {
  const gridImageFilter = isLWorAF() ? {gridImageId: {$ne: null}} : undefined

  return {
    selector: {
      userId: terms.userId,
      curatedOrder: {$exists: false},
      isDeleted: false,
      draft: false,
      $or: [
        {canonicalCollectionSlug: ""},
        {canonicalCollectionSlug: {$exists: false}},
      ],
      ...gridImageFilter,
    },
    options: {
      sort: {
        createdAt: -1
      }
    },
  };
}

/**
 * The /library redesign's merged all-sequences list: curated sequences first
 * (in curated order), then everything else newest-first. Unlike
 * communitySequences this doesn't exclude imageless sequences (the list has a
 * cover-art fallback) or canonical-collection sub-sequences (the design shows
 * them as rows). The SQL layer sorts DESC NULLS LAST, so the null-curatedOrder
 * long tail follows the curated block.
 *
 * Optional terms back the tag/sort popover: filter to a set of library topics
 * and/or curated sequences, and switch between the default ("recommended")
 * order and plain newest-first. Title search doesn't go through this view (the
 * selector layer has no substring matching) — see librarySequencesSearch in
 * sequencesResolvers.ts, which must stay consistent with this view's filters.
 */
function librarySequences(terms: SequencesViewTerms) {
  return {
    selector: {
      isDeleted: false,
      draft: false,
      hidden: false,
      ...(terms.libraryTopics?.length && {libraryTopic: {$in: terms.libraryTopics}}),
      ...(terms.curatedOnly && {curatedOrder: {$exists: true}}),
    },
    options: {
      sort: terms.sortBy === 'newest'
        ? {createdAt: -1}
        : {curatedOrder: -1, createdAt: -1},
    },
  };
}

export const SequencesViews = new CollectionViewSet('Sequences', {
  userProfile,
  userProfilePrivate,
  userProfileAll,
  curatedSequences,
  communitySequences,
  librarySequences
}, defaultView);
