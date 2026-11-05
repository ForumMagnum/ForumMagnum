import { tabLongTitleSetting, tabTitleSetting, type ForumTypeString } from '@/lib/instanceSettings';

export function getPageTitleString(title: string, forumType: ForumTypeString) {
  const siteName = tabTitleSetting.get(forumType) ?? tabLongTitleSetting.get(forumType);
  return `${title} — ${siteName}`;
}
