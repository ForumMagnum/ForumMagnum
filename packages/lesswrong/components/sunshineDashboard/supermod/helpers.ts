export type ContentItem = SunshinePostsList | SunshineCommentsList;

export function isPost(item: ContentItem): item is SunshinePostsList {
  return 'title' in item && item.title !== null;
};
