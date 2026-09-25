/**
 * Spread onto an anchor that Mailgun should leave alone instead of rewriting to its
 * click-tracking redirector. Used for unsubscribe links, so that unsubscribing does
 * not depend on Mailgun's redirector being reachable. Spread rather than written
 * inline because React and eslint both reject unrecognized attribute names.
 */
export const untrackedLinkProps = { "disable-tracking": "true" };
