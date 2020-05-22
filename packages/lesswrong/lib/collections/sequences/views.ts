import { ensureIndex } from '../../collectionUtils';
import { forumTypeSetting } from '../../instanceSettings';
import Sequences from './collection';

Sequences.addDefaultView(terms => {
  const alignmentForum = forumTypeSetting.get() === 'AlignmentForum' ? {af: true} : {}
  let params = {
    selector: {
      hidden: false,
      ...alignmentForum
    }
  }
  return params;
})

function augmentForDefaultView(indexFields)
{
  return { hidden:1, af:1, isDeleted:1, ...indexFields };
}

Sequences.addView("userProfile", function (terms) {
  return {
    selector: {
      userId: terms.userId,
      isDeleted: false,
      draft: false,
    },
    options: {
      sort: {
        userProfileOrder: 1,
        createdAt: -1,
      }
    },
  };
});
ensureIndex(Sequences, augmentForDefaultView({ userId:1, userProfileOrder: -1 }));

Sequences.addView("userProfileAll", function (terms) {
  return {
    selector: {
      userId: terms.userId,
      isDeleted: false,
    },
    options: {
      sort: {
        drafts: -1,
        userProfileOrder: 1,
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
});
ensureIndex(Sequences, augmentForDefaultView({ curatedOrder:-1 }));

Sequences.addView("communitySequences", function (terms) {
  return {
    selector: {
      userId: terms.userId,
      curatedOrder: {$exists: false},
      gridImageId: {$ne: null },
      canonicalCollectionSlug: { $in: [null, ""] },
      isDeleted: false,
      draft: false,
    },
    options: {
      sort: {
        createdAt: -1
      }
    },
  };
});
