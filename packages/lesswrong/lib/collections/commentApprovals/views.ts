import { ensureIndex } from '../../collectionIndexUtils';
import CommentApprovals from './collection';

interface NoViewTerms extends ViewTermsBase {
  view?: undefined;
}

// interface ActiveCommentModeratorActionsViewTerms extends ViewTermsBase {
//   view: 'activeCommentModeratorActions';
//   limit: number;
// }

// declare global {
//   type CommentModeratorActionsViewTerms =
//     | NoViewTerms
//     | ActiveCommentModeratorActionsViewTerms
// }

// CommentApprovals.addView('activeCommentModeratorActions', function (terms: ActiveCommentModeratorActionsViewTerms) {
//   return {
//     selector: {
//       $or: [
//         { endedAt: { $exists: false } },
//         { endedAt: null }
//       ]
//     },
//     options: { sort: { createdAt: -1 }, limit: terms.limit }
//   };
// })
ensureIndex(CommentApprovals, { commentId: 1, createdAt: -1 })
