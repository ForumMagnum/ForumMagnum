import { getSiteUrl } from "@/lib/vulcan-lib/utils";

/**
 * Applied to every onsite link in a digest email. Each link also carries its
 * own `utm_content` identifying the issue and the item it belongs to, which the
 * post page records with its post-view event.
 */
export const AI_DIGEST_UTM_PARAMS = {
  utm_medium: "email",
  utm_campaign: "aiDigest",
};

type AiDigestLinkRole =
  | "image"
  | "title"
  | "byline"
  | "excerpt"
  | "readMore"
  | "threadComment"
  | "masthead"
  | "tune"
  | "explainer";

/** The digest item a link belongs to. */
export interface AiDigestLinkSlot {
  issueId: string;
  sectionKind: AiDigestSectionKind;
  itemIndex: number;
}

function withUtmContent(url: string, utmContent: string): string {
  const trackedUrl = new URL(url, getSiteUrl("LessWrong"));
  trackedUrl.searchParams.set("utm_content", utmContent);
  return trackedUrl.toString();
}

/** Identifies a digest item in its links' `utm_content`: `<issueId>.<section>.<index>`. */
export function aiDigestLinkSlotKey({ issueId, sectionKind, itemIndex }: AiDigestLinkSlot): string {
  return `${issueId}.${sectionKind}.${itemIndex}`;
}

/**
 * The slot key a link's `utm_content` starts with. Links that belong to no
 * item give a key that matches no slot.
 */
export function aiDigestLinkSlotKeyFromUtmContent(utmContent: string): string {
  return utmContent.split(".").slice(0, 3).join(".");
}

/** Tags a link to a digest item with `utm_content=<issueId>.<section>.<index>.<role>`. */
export function aiDigestItemLinkUrl(url: string, role: AiDigestLinkRole, slot: AiDigestLinkSlot): string {
  return withUtmContent(url, `${aiDigestLinkSlotKey(slot)}.${role}`);
}

/** Tags a link that belongs to no item (masthead, footer) with `utm_content=<issueId>.<role>`. */
export function aiDigestChromeLinkUrl(url: string, role: AiDigestLinkRole, issueId: string): string {
  return withUtmContent(url, `${issueId}.${role}`);
}
