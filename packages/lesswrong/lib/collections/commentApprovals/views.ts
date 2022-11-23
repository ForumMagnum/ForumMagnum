import { ensureIndex } from '../../collectionIndexUtils';
import CommentApprovals from './collection';

ensureIndex(CommentApprovals, { commentId: 1, createdAt: -1 })
