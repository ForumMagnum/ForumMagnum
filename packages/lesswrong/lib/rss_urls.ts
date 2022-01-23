import { combineUrls, getSiteUrl } from './vulcan-lib';

export type RSSTerms = any

export const rssTermsToUrl = (terms: RSSTerms) => {
  const siteUrl = getSiteUrl();
  const terms_as_GET_params = Object.keys(terms).map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(terms[k])).join('&')
  return combineUrls(siteUrl, "feed.xml?"+terms_as_GET_params)
}
