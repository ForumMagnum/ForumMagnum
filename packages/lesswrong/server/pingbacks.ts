import type { ForumTypeString } from '@/lib/instanceSettings';
import type { CheerioAPI, Element } from 'cheerio';
import { cheerioParse } from './utils/htmlUtil';
import { parseRoute, parsePath, type PingbackDocument } from '@/lib/routeChecks/parseRoute';
import { getSiteUrl } from '../lib/vulcan-lib/utils';
import { classifyHost } from '../lib/routeUtil';
import { getUrlClass } from './utils/getUrlClass';
import { forEachDocumentBatchInCollection } from './manualMigrations/migrationUtils';
import { getEditableFieldsByCollection } from '@/server/editor/editableSchemaFieldHelpers';
import { getCollection } from '@/server/collections/allCollections';
import { getLatestRev } from './editor/utils';
import { createAnonymousContext } from '@/server/vulcan-lib/createContexts';
import { routePingbackMapping } from '@/lib/routeChecks/pingbackRoutes';

type PingbacksIndex = Partial<Record<CollectionNameString, string[]>>

type PingbackExclusions = Array<{collectionName: string, documentId: string}>|null

export interface ResolvedPingbackLink {
  pingback: PingbackDocument,
  anchor: Element,
}

// Given an HTML document, extract the links from it and convert them to a set
// of pingbacks, formatted as a dictionary from collection name -> array of
// document IDs.
//   html: The document to extract links from
//   exclusions: An array of documents (as
//     {collectionName,documentId}) to exclude. Used for excluding self-links.
export const htmlToPingbacks = async (html: string, exclusions: PingbackExclusions, forumType: ForumTypeString): Promise<PingbacksIndex> => {
  const links = await resolvePingbackLinks(cheerioParse(html), exclusions, forumType);

  // collection name => array of distinct referenced document IDs in that
  // collection, in order of first appearance.
  const pingbacks: PingbacksIndex = {};
  for (const { pingback } of links) {
    const documentIds = pingbacks[pingback.collectionName] ?? [];
    if (!documentIds.includes(pingback.documentId)) {
      pingbacks[pingback.collectionName] = [...documentIds, pingback.documentId];
    }
  }
  return pingbacks;
};

/**
 * The links in a parsed HTML document that point at documents which can
 * receive pingbacks, in document order, with the anchor element of each.
 */
export async function resolvePingbackLinks($: CheerioAPI, exclusions: PingbackExclusions, forumType: ForumTypeString): Promise<ResolvedPingbackLink[]> {
  const URLClass = getUrlClass();
  const context = createAnonymousContext({forumType});
  const resolvedLinks: ResolvedPingbackLink[] = [];

  for (const anchor of $('a').toArray()) {
    const link = $(anchor).attr('href');
    if (!link) continue;
    try {
      // HACK: Parse URLs as though relative to example.com because they have to
      // be the builtin URL parser needs them to be relative to something with a
      // domain, and the domain doesn't matter at all except in whether or not
      // it's in the domain whitelist (which it will only be if it's overridden
      // by an absolute link).
      const linkTargetAbsolute = new URLClass(link, getSiteUrl(context.forumType));

      const hostType = classifyHost(linkTargetAbsolute.host)
      if (hostType==="onsite" || hostType==="mirrorOfUs") {
        const onsiteUrl = linkTargetAbsolute.pathname + linkTargetAbsolute.search + linkTargetAbsolute.hash;
        const parsedUrl = parseRoute({
          location: parsePath(onsiteUrl),
          onError: (pathname) => {},
          routePatterns: Object.keys(routePingbackMapping).reverse() as (keyof typeof routePingbackMapping)[]
        });
        if (parsedUrl.routePattern && routePingbackMapping[parsedUrl.routePattern]) {
          const getPingback = routePingbackMapping[parsedUrl.routePattern];
          const pingback = await getPingback(parsedUrl, context);
          if (pingback && !isExcludedPingback(pingback, exclusions)) {
            resolvedLinks.push({ pingback, anchor });
          }
        }
      }
    } catch (err) {
      console.error("failed to create pingback for link:", link) // eslint-disable-line
      console.error(err) // eslint-disable-line
    }
  }
  return resolvedLinks;
}

function isExcludedPingback(pingback: PingbackDocument, exclusions: PingbackExclusions): boolean {
  return !!exclusions?.some(exclusion =>
    exclusion.documentId===pingback.documentId && exclusion.collectionName===pingback.collectionName
  );
}

export const extractLinks = (html: string): Array<string> => {
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
export async function recomputePingbacks<N extends CollectionNameWithPingbacks>(collectionName: N, forumType: ForumTypeString) {
  type T = ObjectsByCollectionName[N];
  const collection = getCollection(collectionName);
  const context = createAnonymousContext({forumType});

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
          }], forumType);
          
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
export const showPingbacksFrom = async <N extends CollectionNameWithPingbacks>(collectionName: N, _id: string, forumType: ForumTypeString) => {
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
    }], forumType);
    // eslint-disable-next-line no-console
    console.log(pingbacks);
  }
}
