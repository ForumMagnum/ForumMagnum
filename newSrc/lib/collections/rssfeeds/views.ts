import RSSFeeds from "./collection"
import { ensureIndex } from '../../collectionUtils';

//Messages for a specific conversation
RSSFeeds.addView("usersFeed", function (terms) {
  return {
    selector: {userId: terms.userId},
    options: {sort: {createdAt: 1}}
  };
});
ensureIndex(RSSFeeds, {userId: 1, createdAt: 1});
