import { getSiteUrl } from './vulcan-lib/utils';

export type RSSTerms = any

export const rssTermsToUrl = (terms: RSSTerms) => {
  const siteUrl = getSiteUrl();
  const terms_as_GET_params = Object.keys(terms).map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(terms[k])).join('&')
  return siteUrl+"feed.xml?"+terms_as_GET_params;
}
