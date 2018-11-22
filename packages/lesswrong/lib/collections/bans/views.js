import { Bans } from './collections'
import { ensureIndex } from '../../collectionUtils';

// Used in bans/callbacks.js
ensureIndex(Bans, { ip:1 })
