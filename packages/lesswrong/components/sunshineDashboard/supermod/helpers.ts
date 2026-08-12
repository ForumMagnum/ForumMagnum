export type ContentItem = SunshinePostsList | SunshineCommentsList;

/** Title for the moderation inbox tab/window, which names the user being moderated (if any) */
export function getModerationInboxTitle(moderatedUserDisplayName: string | null) {
  return moderatedUserDisplayName ? `Moderating ${moderatedUserDisplayName}` : 'Moderation Inbox';
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
