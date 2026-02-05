import { legacyRouteAcronym } from '@/components/linkPreview/parseRouteWithErrors';
import { classifyHost } from '@/lib/routeUtil';
import { parseRoute, parsePath, type RouterLocation } from '@/lib/vulcan-lib/routes';
import { getUrlClass } from '../utils/getUrlClass';
import { getSiteUrl } from '@/lib/vulcan-lib/utils';

type UrlRewriter = (urlParams: Record<string,string>) => string

export const routeUrlMapping: Record<string,UrlRewriter> = {
  '/posts/:_id/:slug?': ({_id, slug}) => `/api/post/${slug}`,
  '/posts/slug/:slug?': ({_id, slug}) => `/api/post/${slug}`,
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
  const parsedUrl = parseRoute({
    location: parsePath(onsiteUrl),
    onError: (pathname) => {},
    routePatterns: Object.keys(routeUrlMapping).reverse() as (keyof typeof routeUrlMapping)[]
  });

  if (parsedUrl.routePattern && routeUrlMapping[parsedUrl.routePattern]) {
    const mappedUrl = routeUrlMapping[parsedUrl.routePattern](parsedUrl.params);
    return new URLClass(mappedUrl, getSiteUrl()).toString();
  }

  return link;
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
