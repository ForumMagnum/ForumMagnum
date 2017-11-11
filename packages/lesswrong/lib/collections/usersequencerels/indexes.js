import UserSequenceRels from './collection.js';

UserSequenceRels._ensureIndex({'userId': 1, 'sequenceId': 1}, { unique: true});
