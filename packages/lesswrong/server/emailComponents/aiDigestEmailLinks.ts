import { EMAIL_SRC_QUERY_PARAM } from "@/lib/emails/emailTracking";
import { getSiteUrl } from "@/lib/vulcan-lib/utils";
import type { AiDigestSectionKind } from "./AiDigestSpec";

/** Short codes so `emailSrc` stays legible in a hovered or shared URL. */
const sectionCodes: Record<AiDigestSectionKind, string> = {
  recommendations: "rec",
  followUps: "follow",
  discussion: "disc",
  curated: "curated",
};

export type AiDigestLinkRole =
  | "image"
  | "title"
  | "byline"
  | "excerpt"
  | "readMore"
  | "threadComment"
  | "masthead"
  | "tune"
  | "explainer";

/** Which digest item a link belongs to. Omitted for the email's chrome. */
export interface AiDigestLinkSlot {
  sectionKind: AiDigestSectionKind;
  itemIndex: number;
}

/** Mail clients have no base URL to resolve against, so every href must be absolute. */
export function absoluteEmailUrl(url: string): string {
  return new URL(url, getSiteUrl()).toString();
}

/**
 * Tags a digest link with `?emailSrc=<section>.<index>.<role>`, e.g. `rec.2.title`,
 * or with the bare role for chrome links that belong to no item.
 */
export function aiDigestLinkUrl(
  url: string,
  role: AiDigestLinkRole,
  slot?: AiDigestLinkSlot,
): string {
  const emailSrc = slot
    ? `${sectionCodes[slot.sectionKind]}.${slot.itemIndex}.${role}`
    : role;
  const trackedUrl = new URL(url, getSiteUrl());
  trackedUrl.searchParams.set(EMAIL_SRC_QUERY_PARAM, emailSrc);
  return trackedUrl.toString();
}
