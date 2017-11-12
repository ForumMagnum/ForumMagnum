import UserCollectionRels from './collection.js';

UserCollectionRels._ensureIndex({'userId': 1, 'collectionId': 1}, { unique: true});
