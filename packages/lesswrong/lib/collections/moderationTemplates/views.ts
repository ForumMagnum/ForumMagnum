import { ensureIndex } from '../../collectionIndexUtils';
import ModerationTemplates from './collection';

declare global {
  type ModerationTemplatesViewTerms = Omit<ViewTermsBase, 'view'> & ({
    view?: 'moderationTemplatesPage' | 'moderationTemplatesQuickview' | 'rejectionModerationTemplates',
  })
}

ModerationTemplates.addView('moderationTemplatesPage', function (terms: ModerationTemplatesViewTerms) {
  return {
    options: { sort: { deleted: 1, order: 1 } }
  };
})
ensureIndex(ModerationTemplates, { order: 1 })

ModerationTemplates.addView('moderationTemplatesQuickview', function (terms: ModerationTemplatesViewTerms) {
  return {
    selector: { deleted: false },
    options: { sort: { order: 1 } }
  };
})

ModerationTemplates.addView('rejectionModerationTemplates', function (terms) {
  return {
    selector: { collectionName: 'Rejections' }
  };
});
