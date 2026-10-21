import { getSiteUrl } from "@/lib/vulcan-lib/utils";

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

export function aiDigestItemLinkUrl(url: string, role: AiDigestLinkRole, slot: AiDigestLinkSlot): string {
  return withUtmContent(url, `${aiDigestLinkSlotKey(slot)}.${role}`);
}

export function aiDigestChromeLinkUrl(url: string, role: AiDigestLinkRole, issueId: string): string {
  return withUtmContent(url, `${issueId}.${role}`);
}
