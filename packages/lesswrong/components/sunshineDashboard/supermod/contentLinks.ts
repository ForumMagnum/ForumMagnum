import { parseDocumentFromString } from '@/lib/domParser';
import { classifyHost } from '@/lib/routeUtil';

interface ContentWithLinks {
  url?: string | null;
  contents?: { html: string | null } | null;
}

function isOffsiteLink(href: string | null | undefined): boolean {
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

export function contentHasOffsiteLink({ url, contents }: ContentWithLinks): boolean {
  if (isOffsiteLink(url)) return true;
  if (!contents?.html) return false;
  const { document } = parseDocumentFromString(contents.html);
  return Array.from(document.querySelectorAll('a[href]'))
    .some(link => isOffsiteLink(link.getAttribute('href')));
}
