import { Bans } from './collection'
import { ensureIndex } from '../../collectionIndexUtils';

// Used in bans/callbacks.js
ensureIndex(Bans, { ip:1 })
