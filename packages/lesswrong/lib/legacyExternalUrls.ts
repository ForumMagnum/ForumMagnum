const legacyOvercomingBiasHost = /^(https?:)?\/\/(?:www\.)?overcoming-bias\.com(?=[:/?#]|$)/i;

/**
 * Rewrite external URLs whose original hosts no longer resolve, while keeping
 * the path intact so the replacement host's own legacy redirects still apply.
 */
export function rewriteLegacyExternalUrl(href: string): string {
  return href.replace(
    legacyOvercomingBiasHost,
    (_, protocol: string | undefined) => `${protocol ?? ""}//www.overcomingbias.com`,
  );
}
