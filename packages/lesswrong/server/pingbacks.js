import cheerio from 'cheerio';
import { parsePath } from '../components/linkPreview/HoverPreviewLink.jsx';
import { parseRoute } from 'meteor/vulcan:core';
import { hostIsOnsite, getUrlClass } from '../lib/routeUtil';

export const htmlToPingbacks = async (html) => {
  const URLClass = getUrlClass()
  const links = extractLinks(html);
  
  // collection name => array of distinct referenced document IDs in that
  // collection, in order of first appearance.
  const pingbacks = {};
  
  for (let link of links)
  {
    try {
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
          if (pingback) {
            if (!(pingback.collectionName in pingbacks))
              pingbacks[pingback.collectionName] = [];
            if (!pingbacks[pingback.collectionName].includes(pingback.documentId))
              pingbacks[pingback.collectionName].push(pingback.documentId);
          }
        }
      }
    } catch (err) {
      console.error(link) // eslint-disable-line
      console.error(err) // eslint-disable-line
    }
  }  
  return pingbacks;
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

