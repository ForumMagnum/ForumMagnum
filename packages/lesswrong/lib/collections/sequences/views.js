import Sequences from './collection.js';

Sequences.addView("userProfile", function (terms) {
  return {
    selector: {
      userId: terms.userId,
      isDeleted: {$ne: true},
      draft: {$ne: true},
    },
    options: {
      sort: {
        createdAt: -1
      }
    },
  };
});

Sequences.addView("userProfileAll", function (terms) {
  return {
    selector: {
      userId: terms.userId,
      isDeleted: {$ne: true},
    },
    options: {
      sort: {
        drafts: -1,
        createdAt: -1
      }
    },
  };
});

Sequences.addView("curatedSequences", function (terms) {
  return {
    selector: {
      userId: terms.userId,
      curated: true,
      isDeleted: {$ne: true},
      gridImageId: {$ne: null },
      canonicalCollectionSlug: { $in: [null, ""] },
      draft: {$ne: true},
    },
    options: {
      sort: {
        createdAt: -1
      }
    },
  };
});

Sequences.addView("communitySequences", function (terms) {
  return {
    selector: {
      userId: terms.userId,
      curated: {$ne: true},
      gridImageId: {$ne: null },
      canonicalCollectionSlug: { $in: [null, ""] },
      isDeleted: {$ne: true},
      draft: {$ne: true},
    },
    options: {
      sort: {
        createdAt: -1
      }
    },
  };
});
