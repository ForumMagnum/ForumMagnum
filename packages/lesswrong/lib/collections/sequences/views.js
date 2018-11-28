import Sequences from './collection.js';
import { getSetting } from 'meteor/vulcan:core';
import { ensureIndex } from '../../collectionUtils';

Sequences.addDefaultView(terms => {
  const alignmentForum = getSetting('AlignmentForum', false) ? {af: true} : {}
  let params = {
    selector: {
      hidden: {$in: [false,null]},
      ...alignmentForum
    }
  }
  return params;
})
const commonIndexPrefix = { hidden:1, af:1, isDeleted:1 };

Sequences.addView("userProfile", function (terms) {
  return {
    selector: {
      userId: terms.userId,
      isDeleted: {$in: [false,null]},
      draft: {$in: [false,null]},
    },
    options: {
      sort: {
        createdAt: -1
      }
    },
  };
});
ensureIndex(Sequences, { ...commonIndexPrefix, userId:1 });

Sequences.addView("userProfileAll", function (terms) {
  return {
    selector: {
      userId: terms.userId,
      isDeleted: {$in: [false,null]},
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
      isDeleted: {$in: [false,null]},
      gridImageId: {$ne: null },
      draft: {$in: [false,null]},
    },
    options: {
      sort: {
        curatedOrder: -1,
        createdAt: -1
      }
    },
  };
});
ensureIndex(Sequences, { ...commonIndexPrefix, curatedOrder:-1 });

Sequences.addView("communitySequences", function (terms) {
  return {
    selector: {
      userId: terms.userId,
      curatedOrder: {$exists: false},
      gridImageId: {$ne: null },
      canonicalCollectionSlug: { $in: [null, ""] },
      isDeleted: {$in: [false,null]},
      draft: {$in: [false,null]},
    },
    options: {
      sort: {
        createdAt: -1
      }
    },
  };
});
