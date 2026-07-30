/**
 * Query param naming which affordance in an email a click came from, e.g.
 * `emailSrc=rec.2.title`. Mailgun click events report only the destination URL, so
 * this is what makes the specific link recoverable when several links in one item
 * point at the same document.
 */
export const EMAIL_SRC_QUERY_PARAM = "emailSrc";

/**
 * `emailType` for the "Content for You" digest; also its Mailgun tag. The digest's
 * eventual send path must pass `tracking: { emailType: AI_DIGEST_EMAIL_TYPE,
 * campaignId: issueId, recipientId: user._id }`, since selection history joins clicks
 * on exactly those three values.
 */
export const AI_DIGEST_EMAIL_TYPE = "aiDigest";

/**
 * Spread onto an anchor that Mailgun should leave alone instead of rewriting to its
 * click-tracking redirector. Used for unsubscribe links, so that unsubscribing does
 * not depend on Mailgun's redirector being reachable. Spread rather than written
 * inline because React and eslint both reject unrecognized attribute names.
 */
export const untrackedLinkProps = { "disable-tracking": "true" };
