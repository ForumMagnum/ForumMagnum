import UserCollectionRels from './collection.js';

UserCollectionRels.addView("singleUserCollectionRel", function (terms) {
  return {
    selector: {
      collectionId: terms.collectionId,
      userId: terms.userId,
    },
    options: {limit: 1},
  };
});
