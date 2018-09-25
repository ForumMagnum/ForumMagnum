import Sequences from './collection.js';
import { getSetting } from 'meteor/vulcan:core';

Sequences.addDefaultView(terms => {
  const alignmentForum = getSetting('AlignmentForum', false) ? {af: true} : {}
  let params = {
    selector: {
      hidden: {$ne: true},
      ...alignmentForum
    }
  }
  return params;
})

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
      curatedOrder: {$exists: true},
      isDeleted: {$ne: true},
      gridImageId: {$ne: null },
      draft: {$ne: true},
    },
    options: {
      sort: {
        curatedOrder: -1,
        createdAt: -1
      }
    },
  };
});

Sequences.addView("communitySequences", function (terms) {
  return {
    selector: {
      userId: terms.userId,
      curatedOrder: {$exists: false},
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
