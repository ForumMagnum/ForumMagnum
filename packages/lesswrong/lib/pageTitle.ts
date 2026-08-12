import { tabLongTitleSetting, tabTitleSetting } from './instanceSettings';

/** The string that goes in the browser tab/window title for a page with the given title */
export function getPageTitleString(title: string) {
  const siteName = tabTitleSetting.get() ?? tabLongTitleSetting.get();
  return `${title} — ${siteName}`;
}
