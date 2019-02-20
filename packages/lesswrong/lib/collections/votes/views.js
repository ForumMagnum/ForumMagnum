import { Votes } from './collection.js';
import { ensureIndex } from '../../collectionUtils';

ensureIndex(Votes, {cancelled:1, userId:1, documentId:1});
ensureIndex(Votes, {cancelled:1, documentId:1});

// Used by getKarmaChanges
ensureIndex(Votes, {authorId:1, votedAt:1, userId:1, afPower:1});
