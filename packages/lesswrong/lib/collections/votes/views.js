import { Votes } from './collection.js';
import { ensureIndex } from '../../collectionUtils';

ensureIndex(Votes, {documentId:"hashed"});
ensureIndex(Votes, {userId:1, documentId:1});

