import { Votes } from "meteor/vulcan:voting"
import { ensureIndex, removeObsoleteIndexes } from '../../collectionUtils';

ensureIndex(Votes, {documentId:"hashed"});
ensureIndex(Votes, {userId:1, documentId:1});


removeObsoleteIndexes(Votes, [
  { "documentId": 1 }, // Replaced with hashed
]);