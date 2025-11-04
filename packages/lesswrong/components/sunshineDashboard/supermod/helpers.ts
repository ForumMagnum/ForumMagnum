export type ContentItem = SunshinePostsList | CommentsListWithParentMetadata;

export function isPost(item: ContentItem): item is SunshinePostsList {
  return 'title' in item && item.title !== null;
};
