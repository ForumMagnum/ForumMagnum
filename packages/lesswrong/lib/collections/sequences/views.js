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
