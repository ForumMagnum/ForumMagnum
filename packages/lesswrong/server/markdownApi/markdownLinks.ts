import { classifyHost } from '@/lib/routeUtil';
import { parseRoute, parsePath } from '@/lib/routeChecks/parseRoute';
import { getMarkdownPathname } from '@/lib/routeChecks/markdownVersionRoutes';
import { getUrlClass } from '../utils/getUrlClass';
import { getSiteUrl } from '@/lib/vulcan-lib/utils';

type UrlRewriter = (urlParams: Record<string,string>) => string

export const routeUrlMapping: Record<string,UrlRewriter> = {
  // Prefer canonical _id for post links to avoid stale/mismatched slugs.
  '/posts/:_id/:slug?': ({_id, slug}) => `/api/post/${_id || slug}`,
  '/posts/slug/:slug?': ({slug}) => `/api/post/${slug}`,
  '/s/:_id': ({_id}) => `/api/sequence/${_id}`,
  '/s/:_id/p/:postId': ({_id, postId}) => `/api/sequence/${_id}/post/${postId}`,
  '/rationality': () => '/api/rationality',
  '/rationality/:slug': ({slug}) => `/api/rationality/${slug}`,
  '/codex': () => '/api/codex',
  '/codex/:slug': ({slug}) => `/api/codex/${slug}`,
  '/hpmor': () => '/api/hpmor',
  '/hpmor/:slug': ({slug}) => `/api/hpmor/${slug}`,
  '/search': () => '/api/search',
}

export const parseRouteWithErrors = <const T extends string[] | [] = []>(onsiteUrl: string) => {
  return parseRoute<((keyof typeof routeUrlMapping) | T[number])[]>({
    location: parsePath(onsiteUrl),
    routePatterns: Object.keys(routeUrlMapping)
  });
};


export function linkToMarkdownApiLink(link: string): string {
  const URLClass = getUrlClass();
  const linkTargetAbsolute = new URLClass(link, getSiteUrl());
  const hostType = classifyHost(linkTargetAbsolute.host)
  if (hostType!=="onsite") return link;

  const onsiteUrl = linkTargetAbsolute.pathname + linkTargetAbsolute.search + linkTargetAbsolute.hash;
  const markdownPath = getMarkdownPathname(linkTargetAbsolute.pathname);
  if (markdownPath) {
    return `${markdownPath}${linkTargetAbsolute.search}${linkTargetAbsolute.hash}`;
  }

  return onsiteUrl;
}

const MARKDOWN_INLINE_LINK_REGEX = /\]\(\s*<?([^\s)]+)>?(?:\s+"[^"]*")?\s*\)/g;
const MARKDOWN_REFERENCE_LINK_REGEX = /^\s*\[[^\]]+\]:\s*<?(\S+?)>?(?:\s+["'(].*)?$/gm;
const MARKDOWN_AUTOLINK_REGEX = /<((?:https?:\/\/)[^>]+)>/g;

const collectMarkdownUrls = (markdown: string): Set<string> => {
  const urls = new Set<string>();
  let match: RegExpExecArray | null;

  MARKDOWN_INLINE_LINK_REGEX.lastIndex = 0;
  while ((match = MARKDOWN_INLINE_LINK_REGEX.exec(markdown)) !== null) {
    urls.add(match[1]);
  }

  MARKDOWN_REFERENCE_LINK_REGEX.lastIndex = 0;
  while ((match = MARKDOWN_REFERENCE_LINK_REGEX.exec(markdown)) !== null) {
    urls.add(match[1]);
  }

  MARKDOWN_AUTOLINK_REGEX.lastIndex = 0;
  while ((match = MARKDOWN_AUTOLINK_REGEX.exec(markdown)) !== null) {
    urls.add(match[1]);
  }

  return urls;
};

const replaceMarkdownUrls = (markdown: string, replacements: Map<string, string>): string => {
  if (replacements.size === 0) return markdown;

  let output = markdown.replace(MARKDOWN_INLINE_LINK_REGEX, (match, url) => {
    const replacement = replacements.get(url);
    return replacement ? match.replace(url, replacement) : match;
  });

  output = output.replace(MARKDOWN_REFERENCE_LINK_REGEX, (match, url) => {
    const replacement = replacements.get(url);
    return replacement ? match.replace(url, replacement) : match;
  });

  output = output.replace(MARKDOWN_AUTOLINK_REGEX, (match, url) => {
    const replacement = replacements.get(url);
    return replacement ? match.replace(url, replacement) : match;
  });

  return output;
};

export const rewritePostLinksForAgentMarkdown = async (
  markdown: string,
  context: ResolverContext
): Promise<string> => {
  const urls = Array.from(collectMarkdownUrls(markdown));
  const replacements = new Map<string, string>(urls.map(url => [url, linkToMarkdownApiLink(url)]));
  return replaceMarkdownUrls(markdown, replacements);
};
