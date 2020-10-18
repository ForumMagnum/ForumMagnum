import { Bans } from './collection'
import { ensureIndex } from '../../collectionUtils';

// Used in bans/callbacks.js
ensureIndex(Bans, { ip:1 })
