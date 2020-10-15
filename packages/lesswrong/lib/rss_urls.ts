import { siteUrlSetting } from './instanceSettings';
import { Utils } from './vulcan-lib';

export const rssTermsToUrl = (terms) => {
  const siteUrl = siteUrlSetting.get();
  const terms_as_GET_params = Object.keys(terms).map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(terms[k])).join('&')
  return Utils.combineUrls(siteUrl, "feed.xml?"+terms_as_GET_params)
}
