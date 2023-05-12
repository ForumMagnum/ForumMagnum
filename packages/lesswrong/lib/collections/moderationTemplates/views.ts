import { ensureIndex } from '../../collectionIndexUtils';
import ModerationTemplates from './collection';

declare global {
  type ModerationTemplatesViewTerms = Omit<ViewTermsBase, 'view'> & ({
    view?: 'moderationTemplatesPage' | 'rejectionModerationTemplates' | 'messageModerationTemplates',
  })
}

ModerationTemplates.addView('moderationTemplatesPage', function (terms: ModerationTemplatesViewTerms) {
  return {
    options: { sort: { deleted: 1, order: 1 } }
  };
})
ensureIndex(ModerationTemplates, { order: 1 })

ModerationTemplates.addView('rejectionModerationTemplates', function (terms) {
  return {
    selector: { collectionName: 'Rejections' }
  };
});

ModerationTemplates.addView('messageModerationTemplates', function (terms) {
  return {
    selector: { collectionName: 'Messages' }
  };
});
