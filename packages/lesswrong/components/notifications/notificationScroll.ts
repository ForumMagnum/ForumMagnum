import { getSiteUrl } from '../../lib/vulcan-lib/utils';
import { getUrlClass } from '@/server/utils/getUrlClass';
import { scrollFocusOnElement } from '@/lib/scrollUtils';

/**
 * Scroll to the comment a notification points at, in the cases where following
 * the link doesn't do it by itself: clicking a notification for the page you're
 * already on is a no-op navigation, and a `#hash` link doesn't scroll on its own
 * either. On a real navigation to a different page, the page-load scripts in
 * `scrollUtils` handle the scrolling instead.
 */
export function scrollToNotificationTarget(notificationLink: string) {
  const UrlClass = getUrlClass();
  const url = new UrlClass(notificationLink, getSiteUrl());
  const targetId = url.hash ? url.hash.substring(1) : url.searchParams.get("commentId");
  if (!targetId) return;

  const currentTargetId = window.location.hash
    ? window.location.hash.substring(1)
    : new UrlClass(window.location.href).searchParams.get("commentId");
  const alreadyOnTargetLocation =
    url.pathname === window.location.pathname && currentTargetId === targetId;

  if (url.hash || alreadyOnTargetLocation) {
    scrollFocusOnElement({ id: targetId, options: { behavior: "smooth" } });
  }
}
