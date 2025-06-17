import { cheerioParse } from './utils/htmlUtil';
import { parseRoute, parsePath } from '../lib/vulcan-core/appContext';
import { getSiteUrl } from '../lib/vulcan-lib/utils';
import { classifyHost } from '../lib/routeUtil';
import * as _ from 'underscore';
import { getUrlClass } from './utils/getUrlClass';
import { forEachDocumentBatchInCollection } from './manualMigrations/migrationUtils';
import { getEditableFieldsByCollection } from '@/lib/editor/editableSchemaFieldHelpers';
import { getCollection } from '@/server/collections/allCollections';
import { getLatestRev } from './editor/utils';
import { createAnonymousContext } from '@/server/vulcan-lib/createContexts';

export type PingbacksIndex = Partial<Record<CollectionNameString, string[]>>

// Given an HTML document, extract the links from it and convert them to a set
// of pingbacks, formatted as a dictionary from collection name -> array of
// document IDs.
//   html: The document to extract links from
//   exclusions: An array of documents (as
//     {collectionName,documentId}) to exclude. Used for excluding self-links.
export const htmlToPingbacks = async (html: string, exclusions: Array<{collectionName: string, documentId: string}>|null): Promise<PingbacksIndex> => {
  const URLClass = getUrlClass()
  const links = extractLinks(html);
  
  // collection name => array of distinct referenced document IDs in that
  // collection, in order of first appearance.
  const pingbacks: Partial<Record<CollectionNameString, Array<string>>> = {};

  const context = createAnonymousContext();
  
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
          const pingback = await parsedUrl.currentRoute.getPingback(parsedUrl, context);
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

// Exported to allow running from "yarn repl"
export async function recomputePingbacks<N extends CollectionNameWithPingbacks>(collectionName: N) {
  type T = ObjectsByCollectionName[N];
  const collection = getCollection(collectionName);
  const context = createAnonymousContext();

  await forEachDocumentBatchInCollection({
    collection,
    callback: async (batch) => {
      await Promise.all(batch.map(async (doc: ObjectsByCollectionName[N]) => {
        const editableFields = getEditableFieldsByCollection()[collectionName];
        if (!editableFields) return;

        for (const [fieldName, editableField] of Object.entries(editableFields)) {
          const editableFieldOptions = editableField.graphql.editableFieldOptions;
          if (!editableFieldOptions.pingbacks) continue;
          const fieldContents = editableFieldOptions.normalized
            ? await getLatestRev(doc._id, fieldName, context)
            : doc[fieldName as keyof T] as AnyBecauseHard;
          const html = fieldContents?.html ?? "";
          const pingbacks = await htmlToPingbacks(html, [{
            collectionName, documentId: doc._id
          }]);
          
          if (JSON.stringify(doc.pingbacks) !== JSON.stringify(pingbacks)) {
            await collection.rawUpdateOne(
              {_id: doc._id},
              {$set: {pingbacks}}
            );
          }
        }
      }));
    },
  });
}

// Exported to allow running from "yarn repl"
export const showPingbacksFrom = async <N extends CollectionNameWithPingbacks>(collectionName: N, _id: string) => {
  type T = ObjectsByCollectionName[N];
  const collection = getCollection(collectionName);
  const doc = await collection.findOne({_id});
  if (!doc) return;

  const editableFields = getEditableFieldsByCollection()[collectionName];
  if (!editableFields) return;
  
  for (const [fieldName, editableField] of Object.entries(editableFields)) {
    if (!editableField.graphql.editableFieldOptions.pingbacks) continue;
    const fieldContents = doc[fieldName as keyof T] as AnyBecauseHard;
    const html = fieldContents?.html ?? "";
    const pingbacks = await htmlToPingbacks(html, [{
      collectionName, documentId: doc._id
    }]);
    // eslint-disable-next-line no-console
    console.log(pingbacks);
  }
}
