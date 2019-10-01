import cheerio from 'cheerio';
import { parsePath } from '../components/linkPreview/HoverPreviewLink.jsx';
import { parseRoute } from 'meteor/vulcan:core';
import { hostIsOnsite, getUrlClass } from '../lib/routeUtil';
import deepmerge from 'deepmerge';

export const htmlToPingbacks = async (html) => {
  const URLClass = getUrlClass()
  const links = extractLinks(html);
  const pingbacks = [];
  
  for (let link of links)
  {
    // HACK: Parse URLs as though relative to example.com because they have to
    // be the builtin URL parser needs them to be relative to something with a
    // domain, and the domain doesn't matter at all except in whether or not
    // it's in the domain whitelist (which it will only be if it's overridden
    // by an absolute link).
    const linkTargetAbsolute = new URLClass(link, 'http://example.com/');
    
    if (hostIsOnsite(linkTargetAbsolute.host)) {
      const onsiteUrl = linkTargetAbsolute.pathname + linkTargetAbsolute.search + linkTargetAbsolute.hash;
      const parsedUrl = parseRoute({
        location: parsePath(onsiteUrl),
        onError: (pathname) => {
          // Ignore malformed links
        }
      });
      
      if (parsedUrl?.currentRoute?.getPingback) {
        const pingback = await parsedUrl.currentRoute.getPingback(parsedUrl);
        if (pingback)
          pingbacks.push(pingback);
      }
    }
  }
  
  const result = pingbacks.length>1 ? deepmerge.all(pingbacks) : pingbacks.length==1 ? pingbacks[0] : {};
  return result;
};

const extractLinks = (html) => {
  const $ = cheerio.load(html);
  let targets = [];
  $('a').each((i, anchorTag) => {
    const href = $(anchorTag)?.attr('href')
    if (href)
      targets.push(href);
  });
  return targets;
}

