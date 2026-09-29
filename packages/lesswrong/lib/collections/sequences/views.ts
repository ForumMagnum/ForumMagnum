import type { ApolloClient } from '@apollo/client';
import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  interface SequencesViewTerms extends ViewTermsBase {
    view: SequencesViewName | 'default'
    userId?: string
    sequenceIds?: string[]
  }
}

/**
 * When changing this, also update getViewableSequencesSelector.
 */
function defaultView(terms: SequencesViewTerms, _: ApolloClient | undefined, context: ResolverContext) {
  const alignmentForum = context.forumType === 'AlignmentForum' ? {af: true} : {}
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
      gridImageId: {$ne: null},
    },
    options: {
      sort: {
        createdAt: -1
      }
    },
  };
}

export const SequencesViews = new CollectionViewSet('Sequences', {
  userProfile,
  userProfilePrivate,
  userProfileAll,
  curatedSequences,
  communitySequences
}, defaultView);
