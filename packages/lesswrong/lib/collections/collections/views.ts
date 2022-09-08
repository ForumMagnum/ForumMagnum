import { Collections } from './collection';
import { ensureIndex } from '../../collectionIndexUtils';

// Used in Posts and Sequences canonicalCollection resolvers
ensureIndex(Collections, { slug: "hashed" });
