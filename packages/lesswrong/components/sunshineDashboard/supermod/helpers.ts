export type ContentItem = SunshinePostsList | SunshineCommentsList;

export function areAllContentPermissionsDisabled(user: {
  postingDisabled?: boolean | null;
  allCommentingDisabled?: boolean | null;
  conversationsDisabled?: boolean | null;
  votingDisabled?: boolean | null;
}): boolean {
  return !!(
    user.postingDisabled &&
    user.allCommentingDisabled &&
    user.conversationsDisabled &&
    user.votingDisabled
  );
}

export function isPost(item: ContentItem): item is SunshinePostsList {
  return 'title' in item && item.title !== null;
};

export function canRejectContent(item: ContentItem | null | undefined) {
  return !!item && !item.rejected && item.authorIsUnreviewed;
}

const CONTENT_TITLE_MAX_LENGTH = 25;

/** One-line label for a post or comment */
export function getContentTitle(item: ContentItem) {
  const title = (isPost(item) ? item.title : item.contents?.plaintextMainText) ?? "comment";
  return title.length > CONTENT_TITLE_MAX_LENGTH
    ? `${title.slice(0, CONTENT_TITLE_MAX_LENGTH).trimEnd()}…`
    : title;
}
