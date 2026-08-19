export type ContentItem = SunshinePostsList | SunshineCommentsList;

export interface RejectableContent {
  rejected?: boolean | null;
  authorIsUnreviewed?: boolean | null;
}

export interface IndexedRejectableContent extends RejectableContent {
  _id: string;
}

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

export function canRejectContent(item: RejectableContent | null | undefined) {
  return !!item && !item.rejected && !!item.authorIsUnreviewed;
}

/**
 * Finds the next rejectable item after `currentContentId`, wrapping around the
 * list once. The current item is never returned, even before its optimistic
 * rejection has reached the Apollo cache.
 */
export function getNextUnapprovedContentIndex(items: IndexedRejectableContent[], currentContentId: string) {
  if (items.length === 0) return null;

  const currentIndex = items.findIndex(item => item._id === currentContentId);
  for (let offset = 1; offset <= items.length; offset++) {
    const candidateIndex = (currentIndex + offset) % items.length;
    const candidate = items[candidateIndex];
    if (candidate._id !== currentContentId && canRejectContent(candidate)) {
      return candidateIndex;
    }
  }

  return null;
}

/** Whether a keyboard event target is a place the moderator is typing, so plain-letter shortcuts should be ignored */
export function isInTextInput(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
}

const CONTENT_TITLE_MAX_LENGTH = 25;

/** One-line label for a post or comment */
export function getContentTitle(item: ContentItem) {
  const title = (isPost(item) ? item.title : item.contents?.plaintextMainText) ?? "comment";
  return title.length > CONTENT_TITLE_MAX_LENGTH
    ? `${title.slice(0, CONTENT_TITLE_MAX_LENGTH).trimEnd()}…`
    : title;
}
