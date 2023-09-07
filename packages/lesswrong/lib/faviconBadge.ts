import { faviconUrlSetting, faviconWithBadgeSetting } from "../components/common/HeadTags";

export function setFaviconBadge(notificationCount: number) {
  const faviconLinkRel = document.querySelector("link[rel$=icon]");
  if (faviconLinkRel) {
    if (notificationCount > 0) {
      faviconLinkRel.setAttribute("href", faviconWithBadgeSetting.get() ?? faviconUrlSetting.get());
    } else {
      faviconLinkRel.setAttribute("href", faviconUrlSetting.get());
    }
  }
}
