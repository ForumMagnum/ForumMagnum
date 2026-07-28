import { getUrlClass } from '@/server/utils/getUrlClass';

/** Kept short deliberately: `blog.`, `docs.` etc carry meaning. */
const noiseSubdomains = ['www.', 'www2.', 'm.', 'mobile.'];

/** eg `en.m.wikipedia.org`, `de.m.wikipedia.org` */
const localeMobileSubdomainRegex = /^[a-z]{2}\.m\./i;

/** Guards hosts that just start with the prefix, eg `mobile.com`. */
function stripPrefixIfDomainRemains(host: string, prefixLength: number): string|null {
  const remainder = host.slice(prefixLength);
  return remainder.includes('.') ? remainder : null;
}

/**
 * A host with the subdomains that carry no information for a reader removed,
 * eg `www.example.com` and `m.example.com` both become `example.com`. Use this
 * anywhere a host is shown to a user or matched against a list of sites, so
 * that the same URL doesn't read differently in different parts of the site.
 */
export function normalizeDisplayHost(host: string): string {
  // Hosts are case-insensitive, and callers match the result against lists of
  // sites, so normalize the case too.
  const lowercased = host.toLowerCase();
  for (const prefix of noiseSubdomains) {
    if (lowercased.startsWith(prefix)) {
      return stripPrefixIfDomainRemains(lowercased, prefix.length) ?? lowercased;
    }
  }
  if (localeMobileSubdomainRegex.test(lowercased)) {
    // 5 = two-letter language code plus the `m.`
    return stripPrefixIfDomainRemains(lowercased, 5) ?? lowercased;
  }
  return lowercased;
}

/** Normalized host of a URL, or null if it doesn't parse. See normalizeDisplayHost. */
export function getNormalizedHost(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }
  try {
    const URLClass = getUrlClass();
    return normalizeDisplayHost(new URLClass(url).hostname);
  } catch {
    return null;
  }
}
