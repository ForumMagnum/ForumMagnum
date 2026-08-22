import { scrollFocusOnElement } from "@/lib/scrollUtils";
import { getSiteUrl } from "@/lib/vulcan-lib/utils";
import { getUrlClass } from "@/server/utils/getUrlClass";

export function scrollToNotificationTarget({
  notificationLink,
  documentType,
  documentId,
}: {
  notificationLink: string;
  documentType: string | null;
  documentId: string | null;
}) {
  const UrlClass = getUrlClass();
  const url = new UrlClass(notificationLink, getSiteUrl());
  const targetId = url.hash.substring(1) || (documentType === "comment" ? documentId : null);

  if (targetId) {
    scrollFocusOnElement({ id: targetId, options: { behavior: "smooth" } });
  }
}
