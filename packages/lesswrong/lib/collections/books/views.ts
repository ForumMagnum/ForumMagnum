import { Books } from './collection';
import { ensureIndex } from '../../collectionIndexUtils';

// Used in resolvers
ensureIndex(Books, {collectionId: 1});
