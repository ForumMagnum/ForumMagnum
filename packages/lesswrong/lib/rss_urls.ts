import type { ForumTypeString } from '@/lib/instanceSettings';
import { combineUrls, getSiteUrl } from './vulcan-lib/utils';

export type RSSTerms = any

export const rssTermsToUrl = (terms: RSSTerms, forumType: ForumTypeString) => {
  const siteUrl = getSiteUrl(forumType);
  const terms_as_GET_params = Object.keys(terms).map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(terms[k])).join('&')
  return combineUrls(siteUrl, "feed.xml?"+terms_as_GET_params)
}
