import { ensureIndex } from '../../collectionUtils';
import ModerationTemplates from './collection';

declare global {
  type ModerationTemplatesViewTerms = Omit<ViewTermsBase, 'view'> & ({
    view: 'moderationTemplates',
  } | {
    view?: undefined,
  })
}

ModerationTemplates.addView('moderationTemplatesPage', function (terms: ModerationTemplatesViewTerms) {
  return {
    options: { sort: { defaultOrder: 1 } }
  };
})

ensureIndex(ModerationTemplates, { defaultOrder: 1 })
