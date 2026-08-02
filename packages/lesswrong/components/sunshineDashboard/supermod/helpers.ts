export type ContentItem = SunshinePostsList | SunshineCommentsList;

export function isPost(item: ContentItem): item is SunshinePostsList {
  return 'title' in item && item.title !== null;
};

export function canRejectContent(item: ContentItem | null | undefined) {
  return !!item && !item.rejected && item.authorIsUnreviewed;
}

export function getContentTitle(item: ContentItem) {
  return isPost(item)
    ? item.title
    : item.contents?.plaintextMainText ?? "comment";
}
