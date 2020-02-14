import { Books } from './collection';
import { ensureIndex } from '../../collectionUtils';

// Used in resolvers
ensureIndex(Books, {collectionId: 1});
