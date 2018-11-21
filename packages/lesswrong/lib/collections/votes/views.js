import { Votes } from "meteor/vulcan:voting"
import { ensureIndex } from '../../collectionUtils';

// Votes by document (comment) ID
ensureIndex(Votes, { "documentId": 1 });

// Auto-generated indexes from production
ensureIndex(Votes, {userId:1,documentId:1}, {background:true});