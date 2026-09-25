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

const sectionKinds: AiDigestSectionKind[] = ["recommendations", "discussion", "curated"];

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

/** Tags a link to a digest item with `utm_content=<issueId>.<section>.<index>.<role>`. */
export function aiDigestItemLinkUrl(url: string, role: AiDigestLinkRole, slot: AiDigestLinkSlot): string {
  return withUtmContent(url, `${slot.issueId}.${slot.sectionKind}.${slot.itemIndex}.${role}`);
}

/** Tags a link that belongs to no item (masthead, footer) with `utm_content=<issueId>.<role>`. */
export function aiDigestChromeLinkUrl(url: string, role: AiDigestLinkRole, issueId: string): string {
  return withUtmContent(url, `${issueId}.${role}`);
}

function isSectionKind(value: string): value is AiDigestSectionKind {
  return sectionKinds.some((kind) => kind === value);
}

/** The digest item an item link's `utm_content` points at, or null for anything else. */
export function parseAiDigestItemLinkContent(utmContent: string): AiDigestLinkSlot | null {
  const [issueId, sectionKind, itemIndex] = utmContent.split(".");
  const index = Number(itemIndex);
  return issueId && sectionKind && isSectionKind(sectionKind) && Number.isInteger(index)
    ? { issueId, sectionKind, itemIndex: index }
    : null;
}
