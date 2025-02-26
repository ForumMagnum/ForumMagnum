import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  interface RSSFeedsViewTerms extends ViewTermsBase {
    view?: RSSFeedsViewName
    userId?: string,
  }
}

//Messages for a specific conversation
function usersFeed(terms: RSSFeedsViewTerms) {
  return {
    selector: {userId: terms.userId},
    options: {sort: {createdAt: 1}}
  };
}

export const RSSFeedsViews = new CollectionViewSet('RSSFeeds', {
  usersFeed
});
