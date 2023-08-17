import { ensureIndex } from '../../collectionIndexUtils';
import ModerationTemplates from './collection';

declare global {
  type ModerationTemplatesViewTerms = Omit<ViewTermsBase, 'view'> & ({
    view?: 'moderationTemplatesPage' | 'moderationTemplatesList',
    collectionName?: 'Messages' | 'Comments' | 'Rejections'
  })
}

ModerationTemplates.addView('moderationTemplatesPage', function (terms: ModerationTemplatesViewTerms) {
  return {
    options: { sort: { deleted: 1, order: 1 } }
  };
})
ensureIndex(ModerationTemplates, { deleted: 1, order: 1 })

ModerationTemplates.addView('moderationTemplatesList', function (terms) {
  return {
    selector: { deleted: false, collectionName: terms.collectionName }, options: {sort: {order: 1}}
  };
});
ensureIndex(ModerationTemplates, { collectionName: 1, deleted: 1, order: 1 })
