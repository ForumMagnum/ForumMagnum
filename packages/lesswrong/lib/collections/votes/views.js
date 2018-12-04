import { Votes } from "meteor/vulcan:voting"
import { ensureIndex } from '../../collectionUtils';

ensureIndex(Votes, {documentId:"hashed"});
ensureIndex(Votes, {userId:1, documentId:1});

