import { forumTypeSetting, type ForumTypeString, isAF, isLW } from '@/lib/instanceSettings';

export function useForumType(): { isAF: boolean, isLW: boolean, forumType: ForumTypeString } {
  return {
    isAF: isAF(),
    isLW: isLW(),
    forumType: forumTypeSetting.get(),
  };
}
