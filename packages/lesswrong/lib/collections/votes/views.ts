import { Votes } from './collection';
import { ensureIndex, ensurePgIndex } from '../../collectionUtils';

declare global {
  interface VotesViewTerms extends ViewTermsBase {
    view?: VotesViewName
  }
}

ensureIndex(Votes, {cancelled:1, userId:1, documentId:1});
ensureIndex(Votes, {cancelled:1, documentId:1});
ensureIndex(Votes, {cancelled:1, userId:1, votedAt:-1});

// Used by getKarmaChanges
ensureIndex(Votes, {authorId:1, votedAt:1, userId:1, afPower:1});


Votes.addView("tagVotes", function () {
  return {
    selector: {
      collectionName: "TagRels",
      cancelled: false,
    },
    options: {
      sort: {
        votedAt: -1
      }
    }
  }
})
ensureIndex(Votes, {collectionName: 1, votedAt: 1})

ensurePgIndex(Votes, "userAndDocument", "USING BTREE (((json->'cancelled')::bool), (json->>'userId'), (json->>'documentId'))");
ensurePgIndex(Votes, "allOnDocument", "USING BTREE (((json->'cancelled')::bool), (json->>'documentId'))");
ensurePgIndex(Votes, "karmaChanges", "USING BTREE ((json->>'authorId'), (json->>'votedAt'), (json->>'userId'), (json->>'collectionName'), (json->'afPower'))");
