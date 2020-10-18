import { Collections } from './collection';
import { ensureIndex } from '../../collectionUtils';

// Used in Posts and Sequences canonicalCollection resolvers
ensureIndex(Collections, { slug: "hashed" });
