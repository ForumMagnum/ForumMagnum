import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  type ModerationTemplatesViewTerms = Omit<ViewTermsBase, 'view'> & ({
    view?: 'moderationTemplatesPage' | 'moderationTemplatesList',
    collectionName?: 'Messages' | 'Comments' | 'Rejections'
  })
}

function moderationTemplatesPage(terms: ModerationTemplatesViewTerms) {
  return {
    options: { sort: { deleted: 1, order: 1 } }
  };
}

function moderationTemplatesList(terms: ModerationTemplatesViewTerms) {
  return {
    selector: { deleted: false, collectionName: terms.collectionName }, 
    options: {sort: {order: 1}}
  };
}

export const ModerationTemplatesViews = new CollectionViewSet('ModerationTemplates', {
  moderationTemplatesPage,
  moderationTemplatesList
});
