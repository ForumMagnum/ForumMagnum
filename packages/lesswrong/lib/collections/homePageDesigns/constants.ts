export const HOME_PAGE_DESIGN_PUBLIC_ID_LENGTH = 6;
export const HOME_PAGE_DESIGN_MAX_HTML_SIZE = 200 * 1024; // 200 KB

// Temporary: points at the draft marketplace hero post while testing against prod data.
export const MARKETPLACE_POST_ID = "hj2NTuiSJtchfMCtu";

const HOME_DESIGN_PUBLISH_CUTOFF_DATE = new Date("2026-04-01T07:00:00.000Z");

/** Whether the user is eligible to publish designs to the marketplace (and gets the better model). */
export function canPublishHomeDesign(user: DbUser | UsersCurrent | null): boolean {
  if (!user) return false;
  if (user.banned) return false;
  if (user.reviewedByUserId) return true;
  return new Date(user.createdAt) < HOME_DESIGN_PUBLISH_CUTOFF_DATE;
}
