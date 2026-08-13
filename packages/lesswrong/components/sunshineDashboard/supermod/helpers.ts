export type ContentItem = SunshinePostsList | SunshineCommentsList;

export function isPost(item: ContentItem): item is SunshinePostsList {
  return 'title' in item && item.title !== null;
};

export function canRejectContent(item: ContentItem | null | undefined) {
  return !!item && !item.rejected && item.authorIsUnreviewed;
}

/**
 * The moderated user's posts and comments as one newest-first list. Everything
 * that addresses a content item by index (the detail view's focused item, the
 * keyboard handler, the sidebar's action buttons) sorts them this way, so they
 * all agree on what a given index means.
 */
export function getContentSortedByDate(posts: SunshinePostsList[], comments: SunshineCommentsList[]): ContentItem[] {
  return [...posts, ...comments].sort((a, b) =>
    new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
  );
}

/**
 * The index of the user's only rejectable post or comment, or null if they have
 * none or more than one. The actions that reject content and then remove the
 * user from the queue are limited to this case, since with anything else left
 * unreviewed, removing the user would silently approve the rest.
 */
export function getSoleRejectableContentIndex(allContent: ContentItem[]): number | null {
  const rejectableIndexes = allContent.flatMap((item, index) => canRejectContent(item) ? [index] : []);
  return rejectableIndexes.length === 1 ? rejectableIndexes[0] : null;
}

const CONTENT_TITLE_MAX_LENGTH = 25;

/** One-line label for a post or comment */
export function getContentTitle(item: ContentItem) {
  const title = (isPost(item) ? item.title : item.contents?.plaintextMainText) ?? "comment";
  return title.length > CONTENT_TITLE_MAX_LENGTH
    ? `${title.slice(0, CONTENT_TITLE_MAX_LENGTH).trimEnd()}…`
    : title;
}
