/**
 * Fragment for UltraFeed items.
 * IMPORTANT: The post reference inside primaryComment MUST include the full PostsMinimumInfo 
 * fragment, not just _id. Components like UltraFeedCollapsedCommentItem need the full post
 * information, including title, for proper display.
 */
export const UltraFeedItemFragment = `
  fragment UltraFeedItemFragment on UltraFeedItem {
    _id
    type
    renderAsType
    sources
    itemContent
  }
`; 

// /**
//  * Fragment for comment threads in UltraFeed.
//  */
// export const UltraFeedCommentThreadFragment = `
//   fragment UltraFeedCommentThreadFragment on UltraFeedItem {
//     _id
//     type
//     renderAsType
//     sources
//     itemContent
//   }
// `;

// /**
//  * Fragment for posts with comments in UltraFeed.
//  */
// export const UltraFeedPostWithCommentsFragment = `
//   fragment UltraFeedPostWithCommentsFragment on UltraFeedItem {
//     _id
//     type
//     renderAsType
//     sources
//     itemContent
//   }
// `;

// /**
//  * Fragment for spotlight items in UltraFeed.
//  */
// export const DisplayFeedSpotlightFragment = `
//   fragment DisplayFeedSpotlight on UltraFeedItem {
//     _id
//     type
//     renderAsType
//     sources
//     itemContent
//   }
// `;

