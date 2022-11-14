import RSSFeeds from "./collection"
import { ensureIndex } from '../../collectionIndexUtils';

declare global {
  interface RSSFeedsViewTerms extends ViewTermsBase {
    view?: RSSFeedsViewName
    userId?: string,
  }
}

//Messages for a specific conversation
RSSFeeds.addView("usersFeed", function (terms: RSSFeedsViewTerms) {
  return {
    selector: {userId: terms.userId},
    options: {sort: {createdAt: 1}}
  };
});
ensureIndex(RSSFeeds, {userId: 1, createdAt: 1});
