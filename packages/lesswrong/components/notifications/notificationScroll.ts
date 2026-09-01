import { getSiteUrl } from '../../lib/vulcan-lib/utils';
import { scrollFocusOnElement } from '@/lib/scrollUtils';

// Call before navigating. Handles the cases where navigating won't scroll by itself:
// a #hash link, or re-clicking a notification for the page you're already on
// (navigate() no-ops when the URL is unchanged, so nothing else would react).
export function scrollToNotificationTarget(notificationLink: string) {
  const url = new URL(notificationLink, getSiteUrl());
  const targetId = url.hash ? url.hash.substring(1) : url.searchParams.get("commentId");
  if (!targetId) return;

  const currentLocation = new URL(window.location.href);
  const wasAlreadyOnTarget = url.pathname === currentLocation.pathname && (
    currentLocation.hash.substring(1) === targetId ||
    currentLocation.searchParams.get("commentId") === targetId
  );

  if (url.hash || wasAlreadyOnTarget) {
    scrollFocusOnElement({ id: targetId, options: { behavior: "smooth" } });
  }
}
