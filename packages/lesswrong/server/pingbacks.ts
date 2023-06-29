import { cheerioParse } from './utils/htmlUtil';
import { parseRoute, parsePath } from '../lib/vulcan-core/appContext';
import { getSiteUrl } from '../lib/vulcan-lib/utils';
import { classifyHost, getUrlClass } from '../lib/routeUtil';
import * as _ from 'underscore';

// Given an HTML document, extract the links from it and convert them to a set
// of pingbacks, formatted as a dictionary from collection name -> array of
// document IDs.
//   html: The document to extract links from
//   exclusions: An array of documents (as
//     {collectionName,documentId}) to exclude. Used for excluding self-links.
export const htmlToPingbacks = async (html: string, exclusions?: Array<{collectionName:string, documentId:string}>|null): Promise<Partial<Record<CollectionNameString, Array<string>>>> => {
  const URLClass = getUrlClass()
  const links = extractLinks(html);
  
  // collection name => array of distinct referenced document IDs in that
  // collection, in order of first appearance.
  const pingbacks: Partial<Record<CollectionNameString, Array<string>>> = {};
  
  for (let link of links)
  {
    try {
      // HACK: Parse URLs as though relative to example.com because they have to
      // be the builtin URL parser needs them to be relative to something with a
      // domain, and the domain doesn't matter at all except in whether or not
      // it's in the domain whitelist (which it will only be if it's overridden
      // by an absolute link).
      const linkTargetAbsolute = new URLClass(link, getSiteUrl());
      
      const hostType = classifyHost(linkTargetAbsolute.host)
      if (hostType==="onsite" || hostType==="mirrorOfUs") {
        const onsiteUrl = linkTargetAbsolute.pathname + linkTargetAbsolute.search + linkTargetAbsolute.hash;
        const parsedUrl = parseRoute({
          location: parsePath(onsiteUrl),
          onError: (pathname) => {} // Ignore malformed links
        });
        if (parsedUrl?.currentRoute?.getPingback) {
          const pingback = await parsedUrl.currentRoute.getPingback(parsedUrl);
          if (pingback) {
            if (exclusions && _.find(exclusions,
              exclusion => exclusion.documentId===pingback.documentId && exclusion.collectionName===pingback.collectionName))
            {
              // Pingback is excluded
            } else {
              if (!(pingback.collectionName in pingbacks))
                pingbacks[pingback.collectionName] = [];
              if (!pingbacks[pingback.collectionName]!.includes(pingback.documentId))
                pingbacks[pingback.collectionName]!.push(pingback.documentId);
            }
          }
        }
      }
    } catch (err) {
      console.error("failed to create pingback for link:", link) // eslint-disable-line
      console.error(err) // eslint-disable-line
    }
  }
  return pingbacks;
};

const extractLinks = (html: string): Array<string> => {
  const $ = cheerioParse(html);
  let targets: Array<string> = [];
  $('a').each((i, anchorTag) => {
    const href = $(anchorTag)?.attr('href')
    if (href)
      targets.push(href);
  });
  return targets;
}

