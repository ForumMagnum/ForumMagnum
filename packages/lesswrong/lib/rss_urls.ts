import type { ForumTypeString } from '@/lib/instanceSettings';
import { combineUrls, getSiteUrl } from './vulcan-lib/utils';

export type RSSTerms = any

export const rssTermsToUrl = (terms: RSSTerms, forumType: ForumTypeString) => {
  const siteUrl = getSiteUrl(forumType);
  const terms_as_GET_params = Object.keys(terms).map((k) => {
    const value = typeof terms[k] === "object" ? JSON.stringify(terms[k]) : terms[k];
    return encodeURIComponent(k) + '=' + encodeURIComponent(value);
  }).join('&')
  return combineUrls(siteUrl, "feed.xml?"+terms_as_GET_params)
}
