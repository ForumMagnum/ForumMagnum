import { ensureIndex } from '../../collectionUtils';
import ModerationTemplates from './collection';

declare global {
  type ModerationTemplatesViewTerms = Omit<ViewTermsBase, 'view'> & ({
    view: 'moderationTemplatesPage',
  } | {
    view?: undefined,
  })
}

ModerationTemplates.addView('moderationTemplatesPage', function (terms: ModerationTemplatesViewTerms) {
  return {
    options: { sort: { deleted: 1, defaultOrder: 1 } }
  };
})

ensureIndex(ModerationTemplates, { defaultOrder: 1 })
