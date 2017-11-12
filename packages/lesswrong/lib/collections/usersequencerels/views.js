import UserSequenceRels from './collection.js';

UserSequenceRels.addView("singleUserSequenceRel", function (terms) {
  return {
    selector: {
      sequenceId: terms.sequenceId,
      userId: terms.userId,
    },
    options: {limit: 1},
  };
});
