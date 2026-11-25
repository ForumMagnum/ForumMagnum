import { parseDocumentFromString } from '@/lib/domParser';
import { classifyHost } from '@/lib/routeUtil';

export function isOffsiteLink(href: string | null | undefined): boolean {
  if (!href) return false;
  const trimmedHref = href.trim();
  try {
    const url = new URL(trimmedHref.startsWith('//') ? `https:${trimmedHref}` : trimmedHref);
    return (url.protocol === 'http:' || url.protocol === 'https:')
      && classifyHost(url.hostname) === 'offsite';
  } catch {
    return false;
  }
}

export function getLinkHrefs(html: string): string[] {
  const { document } = parseDocumentFromString(html);
  return Array.from(document.querySelectorAll('a[href]'), link => link.getAttribute('href') ?? '');
}
