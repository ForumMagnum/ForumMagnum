/* eslint-disable no-console */

import mysql from 'mysql2/promise';
import fs from 'node:fs';
import Users from '@/lib/collections/users/collection';
import UsersRepo from "../../repos/UsersRepo";
import { loadArbitalDatabase, WholeArbitalDatabase, PageSummariesRow, PagesRow, PageInfosRow, DomainsRow, LensesRow } from './arbitalSchema';
import keyBy from 'lodash/keyBy';
import groupBy from 'lodash/groupBy';
import Tags from '@/lib/collections/tags/collection';
import ArbitalTagContentRels from '@/lib/collections/arbitalTagContentRels/collection';
import { randomId } from '@/lib/random';
import { MultiDocuments } from '@/lib/collections/multiDocuments/collection';
import { executePromiseQueue, asyncMapSequential } from '@/lib/utils/asyncUtils';
import path from 'path';
import { arbitalMarkdownToCkEditorMarkup } from './markdownService';
import Revisions from '@/lib/collections/revisions/collection';
import { afterCreateRevisionCallback, buildRevision } from '@/server/editor/make_editable_callbacks';
import Papa from 'papaparse';
import sortBy from 'lodash/sortBy';
import { htmlToChangeMetrics } from '@/server/editor/utils';
import { getSqlClientOrThrow, runSqlQuery } from '@/server/sql/sqlClient';
import { Comments } from '@/lib/collections/comments/collection.ts';
import uniq from 'lodash/uniq';
import maxBy from 'lodash/maxBy';
import { recomputePingbacks } from '@/server/pingbacks';
import { performVoteServer } from '@/server/voteServer';
import { Votes } from '@/lib/collections/votes/collection.ts';
import mapValues from 'lodash/mapValues';
import flatMap from 'lodash/flatMap';
import { updatePostDenormalizedTags } from '@/server/tagging/helpers';
import { getUnusedSlugByCollectionName } from '@/server/utils/slugUtil';
import { slugify } from '@/lib/utils/slugify';
import ElasticExporter from '@/server/search/elastic/ElasticExporter';
import { SearchIndexCollectionName } from '@/lib/search/searchUtil';
import { userGetDisplayName } from '@/lib/collections/users/helpers';
import { updateDenormalizedHtmlAttributions } from '@/server/tagging/updateDenormalizedHtmlAttributions';
import { updateDenormalizedContributorsList } from '@/server/utils/contributorsUtil';
import { createAdminContext } from "@/server/vulcan-lib/query.ts";
import { createMutator, updateMutator } from "@/server/vulcan-lib/mutators.ts";
import { getCollection } from "@/lib/vulcan-lib/getCollection.ts";

export type ArbitalImportOptions = {
  /**
   * A list of pages to import. If not provided, does a full import (all pages).
   * This exists for testing iteration, since importing all pages is much slower
   * than importing only the page you want to look at for testing.
   */
  pages?: string[]
  
  
  /**
   * Matching Arbital users to LW accounts is a partially manual process. First
   * run `matchArbitalToLWAccounts` to produce a CSV file with candidate
   * matches, then after reviewing the matches, pass that CSV file's filename
   * to future calls to `importArbitalDb`.
   *
   * To create a file with mappings from Arbital users to existing LW users,
   * run Globals.matchArbitalToLWAccounts(connectionString, outputCsvFilename).
   * DO NOT USE THE RESULTING CSV DIRECTLY - it matches on email addresses in
   * a way that may reveal pseudonyms, and must be manually reviewed. After
   * removing any unwanted matches and adding manual matches, run
   * Globals.createImportAccounts(csvFilename) to create new accounts for users
   * that don't have an existing matching. This will edit the CSV in place to
   * add the IDs of the newly created accounts. Finally, pass the filename of
   * that CSV to future import operations.
   */
  userMatchingFile?: string
  
  skipImportingPages?: boolean

  /**
   * 
   */
  coreTagAssignmentsFile?: string
  
  /**
   * Number of wiki pages to import in parallel. Use when latency to the DB is high.
   */
  parallelism?: number,
}
export const defaultArbitalImportOptions: ArbitalImportOptions = {};

const excludedArbitalPageIds = [
  // Rationality
  // This is a stub on the Arbital side, and an important core tag whose tag ID
  // appears all over the place on the LW side
  '9l',
];

export async function connectAndLoadArbitalDatabase(mysqlConnectionString: string): Promise<WholeArbitalDatabase> {
  let connection: mysql.Connection | null = null;

  try {
    console.log("Connecting to Arbital mysql database"); //eslint-disable-line no-console
    connection = await mysql.createConnection(mysqlConnectionString);

    console.log("Loading database into memory"); //eslint-disable-line no-console
    return await loadArbitalDatabase(connection);
  } finally {
    // Close the connection
    if (connection) {
      await connection.end();
    }
  }
}


// Create the connection to database
export const importArbitalDb = async (mysqlConnectionString: string, options?: Partial<ArbitalImportOptions>) => {
  const optionsWithDefaults: ArbitalImportOptions = {...defaultArbitalImportOptions, ...options};
  const wholeDatabase = await connectAndLoadArbitalDatabase(mysqlConnectionString);
  const resolverContext = createAdminContext();

  console.log("Importing data into LW"); //eslint-disable-line no-console
  await doArbitalImport(wholeDatabase, resolverContext, optionsWithDefaults);
}

export const deleteImportedArbitalWikiPages = async (options?: ArbitalImportOptions) => {
  const wikiPagesToDelete = await Tags.find({
    "legacyData.arbitalPageId": {$exists: true},
    deleted: false,
  }).fetch();
  await executePromiseQueue(wikiPagesToDelete.map(wikiPage => async () => {
    await Tags.rawUpdateOne({
      _id: wikiPage._id,
    }, {
      "$set": {
        slug: `deleted-import-${randomId()}`,
        deleted: true,
      },
    });
  }), options?.parallelism ?? 10);
  
  const multiDocumentsToDelete = await MultiDocuments.find({
    //"legacyData.arbitalPageId": {$exists: true},
    deleted: false,
  }).fetch();
  await executePromiseQueue(multiDocumentsToDelete.map(lensOrSummary => async () => {
    await MultiDocuments.rawUpdateOne({
      _id: lensOrSummary._id,
    }, {
      "$set": {
        slug: `deleted-import-${randomId()}`,
        oldSlugs: [],
        deleted: true,
      },
    });
  }), options?.parallelism ?? 10);
}

export const deleteImportedArbitalUsers = async () => {
  const usersToDelete = await Users.find({
    "legacyData.arbitalUserId": {$exists: true}
  }).fetch();
  for (const user of usersToDelete) {
    const newId = randomId();
    await Users.rawUpdateOne({
      _id: user._id,
    }, {
      "$set": {
        username: `deleted-import-${newId}`,
        slug: `deleted-import-${newId}`,
        deleted: true,
      },
    });
  }
}

export const importArbitalPagePairs = async (mysqlConnectionString: string, options?: ArbitalImportOptions) => {
  const database = await connectAndLoadArbitalDatabase(mysqlConnectionString);
  const resolverContext = createAdminContext();
  // Ensure we pass the options through instead of creating a new empty object
  await importPagePairs(database, resolverContext, options || {});
}

export const replaceAllImportedArbitalData = async (mysqlConnectionString: string, options: ArbitalImportOptions) => {
  console.log(`Removing previously-imported wiki pages`);
  await deleteImportedArbitalWikiPages(options);
  await deleteRedLinkPlaceholders(options);
  console.log(`Importing Arbital content`);
  await importArbitalDb(mysqlConnectionString, options);
}

function summaryNameToSortOrder(name: string): number {
  if (name.toLowerCase() === 'brief') return 0;
  if (name.toLowerCase() === 'summary') return 1;
  if (name.toLowerCase() === 'technical') return 2;
  return 3;
}

interface ImportedRecordMaps {
  pageInfosById: Record<string, WholeArbitalDatabase["pageInfos"][number]>,
  pagesById: Record<string, WholeArbitalDatabase["pages"]>,
  lensesByPageId: Record<string, WholeArbitalDatabase["lenses"]>,
  domainsByPageId: Record<string, WholeArbitalDatabase["domains"][number]>,
  summariesByPageId: Record<string, PageSummariesRow[]>,
  slugsByPageId: Record<string, string>,
  titlesByPageId: Record<string, string>,
}

type CreateSummariesForPageArgs = {
  pageId: string;
  importedRecordMaps: ImportedRecordMaps;
  pageCreator: DbUser | null;
  liveRevision: PagesRow;
  resolverContext: ResolverContext;
  conversionContext: ArbitalConversionContext;
} & ({
  tagId: string;
} | {
  lensMultiDocumentId: string;
})

function isDefaultSummaryOrEmpty(summary: PageSummariesRow, pageText: string): boolean {
  if (!summary.text.trim()) return true;
  
  return pageText.startsWith(summary.text);
}

async function createSummariesForPage({ pageId, importedRecordMaps, pageCreator, conversionContext, liveRevision, resolverContext, ...parentIdArg }: CreateSummariesForPageArgs) {
  const { summariesByPageId } = importedRecordMaps;
  const allPageSummaries = summariesByPageId[pageId] ?? [];
  
  const nonDefaultSummaries = allPageSummaries.filter(summary => 
    !isDefaultSummaryOrEmpty(summary, liveRevision.text)
  );

  if (allPageSummaries.length !== nonDefaultSummaries.length) {
    console.log(`Skipping ${allPageSummaries.length - nonDefaultSummaries.length} default summaries for page ${pageId}`);
  }
  
  nonDefaultSummaries.sort((a, b) => summaryNameToSortOrder(a.name) - summaryNameToSortOrder(b.name));

  for (const [idx, summary] of Object.entries(nonDefaultSummaries)) {
    const summaryHtml = await arbitalMarkdownToCkEditorMarkup({
      markdown: summary.text,
      pageId,
      conversionContext,
      convertedPage: summary,
    });

    let parentDocumentId: string;
    let collectionName: string;

    if ('tagId' in parentIdArg) {
      parentDocumentId = parentIdArg.tagId;
      collectionName = "Tags";
    } else {
      parentDocumentId = parentIdArg.lensMultiDocumentId;
      collectionName = "MultiDocuments";
    }

    const summaryObj = (await createMutator({
      collection: MultiDocuments,
      document: {
        parentDocumentId,
        collectionName,
        fieldName: "summary",
        title: summary.name,
        tabTitle: summary.name,
        slug: `${pageId}-${summary.name}`,
        index: parseInt(idx),
        userId: pageCreator?._id,
        contents: {
          originalContents: {
            type: "ckEditorMarkup",
            data: summaryHtml,
          }
        },
        legacyData: {
          arbitalSummaryName: summary.name,
          arbitalPageId: summary.pageId,
        },
      } as AnyBecauseHard,
      context: resolverContext,
      currentUser: pageCreator,
      validate: false,
    })).data;

    await Promise.all([
      backDateObj(MultiDocuments, summaryObj._id, liveRevision.createdAt),
      backDateRevision(summaryObj.contents_latest!, liveRevision.createdAt),
    ]);
    // TODO: Import summaries history?
  }
}

type AlternativeType = 'faster' | 'slower' | 'more_technical' | 'less_technical';
type PageAlternatives = Record<AlternativeType, string[]>;

function computePageAlternatives(database: WholeArbitalDatabase): Record<string, PageAlternatives> {
  // Calculate speed tags for each page (-1=slower, 0=neutral, 1=faster)
  const SLOWER_TAG = '6b4';
  const FASTER_TAG = '6b5';
  const pageSpeeds: Record<string, number> = {};
  for (const pair of database.pagePairs) {
    if (pair.type === 'tag') {
      if (pair.parentId === SLOWER_TAG) {
        pageSpeeds[pair.childId] = -1;
      } else if (pair.parentId === FASTER_TAG) {
        pageSpeeds[pair.childId] = 1;
      }
    }
  }

  // Group subject pairs by their parent (topic)
  const subjectPairsByParent: Record<string, Array<{pageId: string, level: number}>> = {};
  for (const pair of database.pagePairs) {
    if (pair.type === 'subject' && pair.isStrong) {
      if (!subjectPairsByParent[pair.parentId]) {
        subjectPairsByParent[pair.parentId] = [];
      }
      subjectPairsByParent[pair.parentId].push({
        pageId: pair.childId,
        level: pair.level
      });
    }
  }

  // Initialize results
  const results: Record<string, PageAlternatives> = {};
  
  // Helper to ensure a page has an entry in results
  const initPageResult = (pageId: string) => {
    if (!results[pageId]) {
      results[pageId] = {
        faster: [],
        slower: [],
        more_technical: [],
        less_technical: []
      };
    }
  };

  // Process each group of pages that teach the same subject
  for (const [_parentId, pages] of Object.entries(subjectPairsByParent)) {
    // Compare each pair of pages
    for (const page1 of pages) {
      for (const page2 of pages) {
        if (page1.pageId === page2.pageId) continue;

        const speed1 = pageSpeeds[page1.pageId] || 0;
        const speed2 = pageSpeeds[page2.pageId] || 0;

        initPageResult(page1.pageId);
        initPageResult(page2.pageId);

        // Technical level comparisons
        if (page2.level > page1.level) {
          results[page1.pageId].more_technical.push(page2.pageId);
          results[page2.pageId].less_technical.push(page1.pageId);
        } else if (page1.level > page2.level) {
          results[page1.pageId].less_technical.push(page2.pageId);
          results[page2.pageId].more_technical.push(page1.pageId);
        }
        // Speed comparisons (when technical level is equal)
        else if (speed2 > speed1) {
          results[page1.pageId].faster.push(page2.pageId);
          results[page2.pageId].slower.push(page1.pageId);
        } else if (speed1 > speed2) {
          results[page1.pageId].slower.push(page2.pageId);
          results[page2.pageId].faster.push(page1.pageId);
        }
      }
    }
  }

  // Add lens relationships
  const lensesByPage: Record<string, LensesRow[]> = {};
  for (const lens of database.lenses) {
    if (!lensesByPage[lens.pageId]) {
      lensesByPage[lens.pageId] = [];
    }
    lensesByPage[lens.pageId].push(lens);
  }

  // Process lens relationships
  for (const [pageId, lenses] of Object.entries(lensesByPage)) {
    // Sort lenses by their index
    const sortedLenses = [...lenses].sort((a, b) => a.lensIndex - b.lensIndex);
    
    initPageResult(pageId);
    for (let i = 0; i < sortedLenses.length; i++) {
      const currentLens = sortedLenses[i];
      initPageResult(currentLens.lensId);
      
      // Connect to previous lens (if exists)
      if (i > 0) {
        const prevLens = sortedLenses[i-1];
        results[currentLens.lensId].less_technical.push(prevLens.lensId);
        results[prevLens.lensId].more_technical.push(currentLens.lensId);
      }
      
      // Connect to main page
      results[currentLens.lensId].less_technical.push(pageId);
      results[pageId].more_technical.push(currentLens.lensId);
    }
  }

  // Remove duplicates and ensure valid pages
  const validPages = new Set(database.pageInfos
    .filter(pi => pi.currentEdit > 0 && !pi.isDeleted)
    .map(pi => pi.pageId)
  );

  for (const [pageId, alternatives] of Object.entries(results)) {
    if (!validPages.has(pageId)) {
      delete results[pageId];
      continue;
    }
    
    for (const type of Object.keys(alternatives) as AlternativeType[]) {
      alternatives[type] = [...new Set(alternatives[type])]
        .filter(id => validPages.has(id));
    }
  }

  return results;
}

type PagesToConvertToLenses = Array<{
  tagId: string;
  arbitalPageId: string;
}>;

type RedLinksSet = Array<{
  slug: string
  title: string
  referencedFromPage: string
}>;

export type ArbitalConversionContext = {
  database: WholeArbitalDatabase,
  options: ArbitalImportOptions,
  matchedUsers: Record<string,DbUser|null>
  defaultUser: DbUser,
  slugsByPageId: Record<string,string>
  summariesByPageId: Record<string, PageSummariesRow[]>,
  linksById: Record<string,string>
  titlesByPageId: Record<string,string>
  pageIdsByTitle: Record<string,string>
  pageInfosByPageId: Record<string, PageInfosRow>,
  domainsByPageId: Record<string, DomainsRow>,
  imageUrlsCache: Record<string,string>,
  pagesToConvertToLenses: PagesToConvertToLenses,
  liveRevisionsByPageId: Record<string,WholeArbitalDatabase["pages"][0]>,
  outRedLinks: RedLinksSet
}

async function doArbitalImport(database: WholeArbitalDatabase, resolverContext: ResolverContext, options: ArbitalImportOptions): Promise<void> {
  const { existingPagesToMove, pagesToConvertToLenses } = await doFindCollidingWikiPages(database);
  await renameCollidingWikiPages(existingPagesToMove);

  const conversionContext = await buildConversionContext(database, pagesToConvertToLenses, options);
  //const conversionContext = await buildConversionContext(database, [], options);
  await importWikiPages(database, conversionContext, resolverContext, options);
  
  const redLinks = conversionContext.outRedLinks;
  fs.writeFileSync("redLinksCache.json", JSON.stringify(redLinks));
  
  //const redLinks = JSON.parse(fs.readFileSync("redLinksCache.json", 'utf-8'));
  await createRedLinkPlaceholders(redLinks, conversionContext);
  
  await recomputePingbacks("Tags");
  await recomputePingbacks("MultiDocuments");

  // This needs to be rerun whenever the page import is run
  await importPagePairs(database, resolverContext, options);

  if (options.coreTagAssignmentsFile) {
    await importCoreTagAssignments(options.coreTagAssignmentsFile);
  }

  await importComments(database, conversionContext, resolverContext, options);
}


async function doFindCollidingWikiPages(database: WholeArbitalDatabase): Promise<{
  existingPagesToMove: Array<{
    lwWikiPageSlug: string
    newSlug: string
  }>
  pagesToConvertToLenses: PagesToConvertToLenses
}> {
  const existingPagesToMove: Array<{
    lwWikiPageSlug: string
    newSlug: string
  }> = [];
  const pagesToConvertToLenses: PagesToConvertToLenses = [];

  const pagesById = groupBy(database.pages, p=>p.pageId);
  const wikiPageIds = database.pageInfos
    .filter(pi => pi.type === "wiki" && !excludedArbitalPageIds.includes(pi.pageId))
    .map(pi=>pi.pageId);

  // Find wiki pages that were previously moved out of the way by a previous
  // Arbital import, which should be converted to lenses again
  const previouslyMovedPages: Array<{_id: string, slug: string}> = await runSqlQuery(`
    SELECT _id,slug
    FROM "Tags"
    WHERE slug LIKE 'lwwiki-old-%'
  `);
  console.log(`Found ${previouslyMovedPages.length} previously-moved pages`);
  const previouslyMovedPagesByOriginalSlug = keyBy(
    previouslyMovedPages,
    ({_id, slug}) => slug.substring("lwwiki-old-".length)
  );

  // Find existing wiki pages that have name collisions with incoming Arbital
  // pages
  await executePromiseQueue(wikiPageIds
    .filter(pageId => pagesById[pageId]?.some(revision => revision.isLiveEdit))
    .map(pageId => {
      const revisions = pagesById[pageId] ?? [];
      const liveRevision = revisions.filter(r => r.isLiveEdit)[0];
      const title = liveRevision.title;
      const desiredSlug = slugify(title)
      
      return async () => {
        const pageUsingSlug = await Tags.findOne({
          slug: desiredSlug
        });
        if (pageUsingSlug) {
          existingPagesToMove.push({
            lwWikiPageSlug: desiredSlug,
            newSlug: `lwwiki-old-${desiredSlug}`,
          });
          pagesToConvertToLenses.push({
            tagId: pageUsingSlug._id,
            arbitalPageId: pageId,
          });
        } else if (previouslyMovedPagesByOriginalSlug[desiredSlug]) {
          pagesToConvertToLenses.push({
            tagId: previouslyMovedPagesByOriginalSlug[desiredSlug]._id,
            arbitalPageId: pageId,
          });
        }
      }
    }), 10
  );
  
  return { existingPagesToMove, pagesToConvertToLenses };
}

export const findCollidingWikiPages = async (mysqlConnectionString: string) => {
  const arbitalDb = await connectAndLoadArbitalDatabase(mysqlConnectionString);
  const { existingPagesToMove, pagesToConvertToLenses } = await doFindCollidingWikiPages(arbitalDb);
  console.log(existingPagesToMove);
  console.log(pagesToConvertToLenses);
}

async function renameCollidingWikiPages(existingPagesToMove: Array<{
  lwWikiPageSlug: string
  newSlug: string
}>): Promise<void> {
  // Rename existing wiki pages to slugs starting with lwwiki-old-, and mark them as deleted
  await executePromiseQueue(
    existingPagesToMove.map(({lwWikiPageSlug, newSlug}) => {
      return async () => {
        return Tags.rawUpdateOne(
          {slug: lwWikiPageSlug},
          {$set: {
            slug: newSlug,
            deleted: true,
          }}
        );
      }
    }),
    10
  );
  
  // Ensure any previously-moved pages are marked as deleted
  await runSqlQuery(`
    UPDATE "Tags"
    SET deleted=true
    WHERE slug LIKE 'lwwiki-old-%'
  `);
}

export async function buildConversionContext(database: WholeArbitalDatabase, pagesToConvertToLenses: PagesToConvertToLenses, options: ArbitalImportOptions): Promise<ArbitalConversionContext> {
  const pagesById = groupBy(database.pages, p=>p.pageId);
  const pageInfosById = keyBy(database.pageInfos, pi=>pi.pageId);
  const summariesByPageId = groupBy(database.pageSummaries, s=>s.pageId);
  
  //const matchedUsers: Record<string,DbUser|null> = { '2': await resolverContext.loaders.Users.load('nmk3nLpQE89dMRzzN') };
  const matchedUsers: Record<string,DbUser|null> = options.userMatchingFile
    ? await loadUserMatching(options.userMatchingFile)
    : {};

  const defaultUser: DbUser|null = await Users.findOne({ username: "arbitalimport" });
  if (!defaultUser) {
    throw new Error("There must be a fallback user named arbitalimport to assign edits to");
  }

  const wikiPageIds = database.pageInfos.filter(pi => pi.type === "wiki").map(pi=>pi.pageId);
  const pageIdsByTitle: Record<string,string> = {};
  const titlesByPageId: Record<string,string> = {};
  const liveRevisionsByPageId: Record<string,WholeArbitalDatabase["pages"][0]> = {};
  const domainsByPageId = keyBy(database.domains, d=>d.id);
  
  let slugsByPageId: Record<string,string> = {};
  let linksById: Record<string,string> = {};
  /*const slugsCachePath = path.join(__dirname, "./slugsByPageId.json");
  let cacheLoaded = false;
  if (fs.existsSync(slugsCachePath)) {
    slugsByPageId = JSON.parse(fs.readFileSync(slugsCachePath, "utf8"));
    cacheLoaded = true;
  }*/

  await executePromiseQueue(wikiPageIds
    .filter(pageId => pagesById[pageId]?.some(revision => revision.isLiveEdit))
    .map(pageId => {
      const pageInfo = pageInfosById[pageId];
      
      const revisions = pagesById[pageId] ?? [];
      const liveRevision = revisions.filter(r => r.isLiveEdit)[0];
      const title = liveRevision.title;
      
      return async () => {
        if (pageInfo.isDeleted) return;
        if (pageInfo.seeDomainId !== 0) return;

        pageIdsByTitle[title] = pageId;
        titlesByPageId[pageId] = title;
        liveRevisionsByPageId[pageId] = liveRevision;
        
        // We can assume the slug is available because of the earlier call to
        // renameCollidingWikiPages().
        const slug = slugify(title);
        slugsByPageId[pageId] = slug;
        linksById[pageId] = `/w/${slug}`;
        /*if (!cacheLoaded) {
          slugsByPageId[pageId] = await getUnusedSlugByCollectionName("Tags", slugify(title));
        }*/
      };
    }), 10
  );
   
  //fs.writeFileSync(slugsCachePath, JSON.stringify(slugsByPageId, null, 2));

  // Links to Arbital user-profile pages go to corresponding LW user pages based on matching
  for (const [arbitalUserId,lwUser] of Object.entries(matchedUsers)) {
    if (lwUser) {
      if (arbitalUserId in linksById) {
        console.warn(`Arbital page ID ${arbitalUserId} may be being imported as both a wiki page and a user-matching?`);
      }
      linksById[arbitalUserId] = `/users/${lwUser.slug}`;
      titlesByPageId[arbitalUserId] = userGetDisplayName(lwUser);
    }
  }
  
  // Determine URLs for links to lensIds
  for (const lens of database.lenses) {
    const lensPageInfo = pageInfosById[lens.lensId];
    if (!lensPageInfo || lensPageInfo.isDeleted) {
      continue;
    }

    const lensSlug = lensPageInfo.alias;
    const pageLink = linksById[lens.pageId];
    if (pageLink) {
      linksById[lens.lensId] = `${pageLink}?lens=${lensSlug}`;
    }
  }

  return {
    database,
    options,
    matchedUsers, defaultUser,
    slugsByPageId,
    summariesByPageId,
    linksById,
    titlesByPageId,
    pageIdsByTitle,
    pageInfosByPageId: pageInfosById,
    domainsByPageId,
    liveRevisionsByPageId,
    pagesToConvertToLenses,
    imageUrlsCache: {},
    outRedLinks: [],
  };
  
}

function getImportedRecordMaps(conversionContext: ArbitalConversionContext): ImportedRecordMaps {
  const pagesById = groupBy(conversionContext.database.pages, p=>p.pageId);
  const lensesByPageId = mapValues(groupBy(conversionContext.database.lenses, l=>l.pageId), lenses=>sortBy(lenses, l=>l.lensIndex));
  const {
    domainsByPageId,
    summariesByPageId,
    slugsByPageId,
    titlesByPageId,
  } = conversionContext;
  const importedRecordMaps: ImportedRecordMaps = {
    pageInfosById: conversionContext.pageInfosByPageId,
    pagesById,
    lensesByPageId,
    domainsByPageId,
    summariesByPageId,
    slugsByPageId,
    titlesByPageId,
  };
  return importedRecordMaps
}
async function importWikiPages(database: WholeArbitalDatabase, conversionContext: ArbitalConversionContext, resolverContext: ResolverContext, options: ArbitalImportOptions): Promise<void> {
  const pagesById = groupBy(database.pages, p=>p.pageId);
  const lensesByPageId = mapValues(groupBy(database.lenses, l=>l.pageId), lenses=>sortBy(lenses, l=>l.lensIndex));
  const lensIds = new Set(database.lenses.map(l=>l.lensId));
  const tagIdsToReindex: string[] = [];

  const {
    pageInfosByPageId: pageInfosById, slugsByPageId, summariesByPageId, titlesByPageId,
    pageIdsByTitle, domainsByPageId, matchedUsers, defaultUser, liveRevisionsByPageId,
    pagesToConvertToLenses,
  } = conversionContext;
  console.log(`There are ${Object.keys(liveRevisionsByPageId).length} wiki pages with live revisions`);
  
  const importedRecordMaps: ImportedRecordMaps = getImportedRecordMaps(conversionContext);
  
  const pageIdsToImport = options.pages
    ? options.pages.map(p => {
        if (pageIdsByTitle[p]) return pageIdsByTitle[p];
        if (pagesById[p]) return p;
        throw new Error(`Page title not found: ${p}`)
      })
    : Object.keys(liveRevisionsByPageId).filter(pageId => !lensIds.has(pageId) && !excludedArbitalPageIds.includes(pageId))
  console.log(`Importing ${pageIdsToImport.length} pages`)

  console.log("Importing pages with ids:", pageIdsToImport);
  
  const alternativesByPageId = computePageAlternatives(database);
  
  await executePromiseQueue(pageIdsToImport.map((pageId) => async () => {
    try {
      const pageInfo = pageInfosById[pageId];
      if (pageInfo.isDeleted) return;
      const lenses = lensesByPageId[pageId] ?? [];
      const revisions = database.pages.filter(p => p.pageId === pageId)
        .sort(r => r.edit)
        .filter(r => !r.isAutosave);
      const firstRevision = revisions[0];
      const liveRevision = liveRevisionsByPageId[pageId];
      const title = liveRevision.title;
      const pageCreator = matchedUsers[pageInfo.createdBy] ?? defaultUser;
      const slug = slugsByPageId[pageId];

      const pageAliasRedirects = database.aliasRedirects.filter(ar => ar.newAlias === pageInfo.alias);
      const oldSlugs = uniq([pageInfo.alias, pageInfo.pageId, ...pageAliasRedirects.map(ar => ar.oldAlias)]);

      const oldestRev = revisions[0];
      const oldestRevArbitalMarkdown = oldestRev.text;
      const oldestRevCkEditorMarkup = await arbitalMarkdownToCkEditorMarkup({
        markdown: oldestRevArbitalMarkdown, pageId, conversionContext,
        convertedPage: oldestRev,
      });
      console.log(`Creating wiki page: ${title} (${slug}).  Lenses found: ${lenses.map(l=>l.lensName).join(", ")}`);

      // If we're going to merge with an LW wiki page, fetch that page for reference
      const lwWikiPageToConvertToLens = pagesToConvertToLenses.find(({arbitalPageId}) => arbitalPageId === pageId);
      const lwWikiPage = lwWikiPageToConvertToLens ? await Tags.findOne({_id: lwWikiPageToConvertToLens.tagId}) : null;

      // Create wiki page with the oldest revision (we will create the rest of
      // revisions next; creating them in-order ensures some on-insert callbacks
      // work properly.)
      let wiki: DbTag|null;
      if (options.skipImportingPages) {
        wiki = await Tags.findOne({ 'legacyData.arbitalPageId': pageId });
        if (!wiki) {
          console.log(`Wiki page not found: ${pageId}`);
          return;
        }
      } else {
        wiki = (await createMutator({
          collection: Tags,
          document: {
            name: title,
            slug: slug,
            oldSlugs,
            wikiOnly: true,
            description: {
              originalContents: {
                type: "ckEditorMarkup",
                data: oldestRevCkEditorMarkup,
              },
            },
            legacyData: {
              "arbitalPageId": pageId,
              ...(lwWikiPage ? {mergedLWTagId: lwWikiPage._id} : {}),
            },
          },
          context: resolverContext,
          currentUser: pageCreator,
          validate: false, //causes the check for name collisions to be skipped
        })).data;
        // Back-date it to when it was created on Arbital
        await Promise.all([
          backDateObj(Tags, wiki._id, pageInfo.createdAt),
          backDateDenormalizedEditable(Tags, wiki._id, "description", pageInfo.createdAt),
          backDateRevision(wiki.description_latest!, pageInfo.createdAt),
        ]);
      }

      tagIdsToReindex.push(wiki._id);
      await convertLikesToVotes(conversionContext, pageInfo.likeableId, "Tags", wiki._id);

      const pageAlternatives = alternativesByPageId[pageId];
      if (pageAlternatives && Object.values(pageAlternatives).some(alternatives => alternatives.length > 0)) {
        await updateMutator({
          collection: Tags,
          documentId: wiki._id,
          set: {
            legacyData: {
              ...wiki.legacyData,
              arbitalFasterAlternatives: pageAlternatives.faster ?? [],
              arbitalSlowerAlternatives: pageAlternatives.slower ?? [],
              arbitalMoreTechnicalAlternatives: pageAlternatives.more_technical ?? [],
              arbitalLessTechnicalAlternatives: pageAlternatives.less_technical ?? [],
            },
          },
          currentUser: pageCreator,
          context: resolverContext,
        });
      }

      await createSummariesForPage({
        pageId,
        importedRecordMaps,
        conversionContext,
        pageCreator,
        liveRevision,
        resolverContext,
        tagId: wiki._id,
      });

      if (!options.skipImportingPages) {
        // Fill in some metadata on the first revision
        const lwFirstRevision: DbRevision = (await Revisions.findOne({_id: wiki.description_latest}))!;
        await Revisions.rawUpdateOne(
          {_id: lwFirstRevision._id},
          {$set: {
            editedAt: firstRevision.createdAt,
            commitMessage: firstRevision.editSummary,
            version: `1.0.0`,
            legacyData: {
              "arbitalPageId": pageId,
              "arbitalEditNumber": firstRevision.edit,
              "arbitalMarkdown": firstRevision.text,
            },
          }}
        );
        
  
        // Create other revisions besides the first one
        await importRevisions({
          collection: Tags,
          fieldName: "description",
          documentId: wiki._id,
          pageId: pageId,
          revisions: revisions.slice(1),
          oldestRevCkEditorMarkup,
          conversionContext,
          resolverContext,
        })
      }

      // Add lenses
      if (lenses.length > 0) {
        console.log(`Importing ${lenses.length} lenses (${lenses.map(l => l.lensName).join(", ")})`);
      }
      for (const lens of lenses) {
        const lensCreator = matchedUsers[lens.createdBy] ?? defaultUser;
        await importSingleLens({
          conversionContext, lens, parentTagId: wiki._id, resolverContext,
          lensCreator,
        });
      }
      
      if (lwWikiPageToConvertToLens) {
        console.log(`Converting LW wiki page ${lwWikiPageToConvertToLens.tagId} to a lens`);
        if (!lwWikiPage) return;
        const lwWikiPageCreator: DbUser = (await Users.findOne({_id: lwWikiPage.userId}))!;
        const lwWikiLensSlug = await getUnusedSlugByCollectionName("MultiDocuments", `lwwiki-${slugify(title)}`);
        const lwWikiLensIndex = lenses.length > 0
          ? maxBy(lenses, l => l.lensIndex)!.lensIndex + 1
          : 0;
        tagIdsToReindex.push(lwWikiPageToConvertToLens.tagId);

        const lwWikiPageRevisions = await Revisions.find({
          documentId: lwWikiPage._id,
          fieldName: "description",
          collectionName: "Tags",
        }, { sort: { editedAt: 1} }).fetch();
        if (!lwWikiPageRevisions.length) {
          return;
        }

        const lwWikiLens = (await createMutator({
          collection: MultiDocuments,
          document: {
            parentDocumentId: wiki._id,
            collectionName: "Tags",
            fieldName: "description",
            title: "LW Wiki",
            slug: lwWikiLensSlug,
            oldSlugs: [],
            preview: "",
            tabTitle: "LW Wiki",
            tabSubtitle: "",
            userId: lwWikiPageCreator?._id,
            index: lwWikiLensIndex,
            legacyData: {
            },
          } as Partial<DbMultiDocument>,
          context: resolverContext,
          currentUser: lwWikiPageCreator,
          validate: false,
        })).data;

        // Backdate the lens and the automatically-created revision to the
        // timestamp of the earliest revision on the LW wiki page, minus one second (to avoid potential ordering issues with the copied-over revisions)
        const earliestRevisionTimestamp = new Date(lwWikiPageRevisions[0].createdAt.getTime() - 1000);

        await Promise.all([
          backDateObj(MultiDocuments, lwWikiLens._id, earliestRevisionTimestamp),
          backDateRevision(lwWikiLens.contents_latest!, earliestRevisionTimestamp),
        ]);

        // Clone revisions on the LW wiki page as revisions on the lens
        for (const lwWikiPageRevision of lwWikiPageRevisions) {
          const { _id, ...fieldsToCopy } = lwWikiPageRevision;
          await Revisions.rawInsert({
            ...fieldsToCopy,
            fieldName: "contents",
            documentId: lwWikiLens._id,
            collectionName: "MultiDocuments",
          });
        }
        const latestRev = maxBy(lwWikiPageRevisions, r=>r.editedAt)!;
        
        // Move TagRels/comments/etc from the original LW wiki page, and any
        // previous imports that merged with that page, onto the new merged
        // page.
        const oldMergedTagIds = (await Tags.find({
          "legacyData.mergedLWTagId": lwWikiPage._id,
          deleted: true,
        }).fetch()).map(t=>t._id);
        await moveFieldsOnMergedPage({lwWikiPage, mergedPage: wiki});
        await moveReferencesToMergedPage({
          oldTagIds: [lwWikiPage._id, ...oldMergedTagIds],
          newTagId: wiki._id,
        });
        
        // Set the active rev on the new lens
        await MultiDocuments.rawUpdateOne(
          { _id: lwWikiLens._id },
          {$set: {
            contents_latest: latestRev._id,
          }}
        );
      }
    } catch(e) {
      console.error(e);
    }
  }), options.parallelism ?? 1);
  
  // Update Algolia index for updated tags
  await updateElasticSearchForIds("Tags", tagIdsToReindex);
}

async function importComments(database: WholeArbitalDatabase, conversionContext: ArbitalConversionContext, resolverContext: ResolverContext, options: ArbitalImportOptions): Promise<void> {
  const lensesByLensId = keyBy(database.lenses, l=>l.lensId);
  const commentPageInfos = database.pageInfos.filter(pi => pi.type === "comment");
  const pageInfosById = keyBy(database.pageInfos, pi=>pi.pageId);
  let irregularComments: {reason: string, commentId: string}[] = [];

  const commentIdsToImport: string[] = [];
  let lwCommentsById: Record<string, DbComment> = {};
  const commentIdsToReindexInElastic: string[] = [];
  
  // Sort comments by creation date so that we only insert a comment after
  // inserting its parent
  for (const comment of sortBy(commentPageInfos, c=>c.createdAt)) {
    const commentId = comment.pageId;
    const revs = database.pages.filter(p => p.pageId === comment.pageId);
    const publicRevs = revs.filter(r => !r.isAutosave);
    const livePublicRev = revs.find(r => r.isLiveEdit);
    if (!livePublicRev) {
      irregularComments.push({reason: "No live rev", commentId});
      continue;
    }
    if (livePublicRev.text.trim().length === 0) {
      irregularComments.push({reason: "Live rev comment text is empty string", commentId});
      continue;
    }
    
    // A comment has either one or two parents. If it has one parent, the parent
    // is a wiki page; if it has two, then one parent is a wiki page and the
    // other is a comment.
    const parentIds = database.pagePairs.filter(p => p.childId === comment.pageId).map(p => p.parentId);
    if (parentIds.some(parentId => !pageInfosById[parentId])) {
      irregularComments.push({reason: "Has a parent that doesn't exist", commentId});
      continue;
    }
    let wikiPageParentId = parentIds.find(parentId => pageInfosById[parentId]?.type === "wiki")
    const parentCommentId = parentIds.find(parentId => pageInfosById[parentId]?.type === "comment")
    if (!wikiPageParentId) {
      irregularComments.push({reason: "Not a reply to a wiki page", commentId});
      continue;
    }

    if (lensesByLensId[wikiPageParentId]) {
      // If the parent is a lens, then the comment is a reply to a lens.
      // We don't plan on supporting replies to lenses, so instead reassign to the top-level page
      wikiPageParentId = lensesByLensId[wikiPageParentId].pageId;
    }
    
    commentIdsToImport.push(commentId);
    const commentUser = conversionContext.matchedUsers[comment.createdBy] ?? conversionContext.defaultUser;
    const liveRevCkEditorMarkup = await arbitalMarkdownToCkEditorMarkup({
      markdown: livePublicRev.text,
      pageId: commentId,
      conversionContext,
      convertedPage: livePublicRev,
    });
    const lwWikiPageId = wikiPageParentId ? (await Tags.findOne({
      "legacyData.arbitalPageId": wikiPageParentId,
      deleted: false,
    }))?._id : null;
    const lwComment = (await createMutator({
      collection: Comments,
      document: {
        contents: {
          originalContents: {
            type: "ckEditorMarkup",
            data: liveRevCkEditorMarkup,
          },
        },
        tagId: lwWikiPageId,
        parentCommentId: parentCommentId ? (lwCommentsById[parentCommentId]?._id ?? null) : null,
        legacyData: {
          arbitalPageId: commentId,
          arbitalMarkdown: livePublicRev.text,
        },
      },
      currentUser: commentUser,
      context: resolverContext,
      validate: false,
    })).data;
    lwCommentsById[commentId] = lwComment;
    commentIdsToReindexInElastic.push(lwComment._id);

    await Comments.rawUpdateOne({_id: lwComment._id}, {
      $set: {
        createdAt: comment.createdAt,
        lastEditedAt: livePublicRev.createdAt,
        postedAt: comment.createdAt,
      }
    });
    
    await convertLikesToVotes(conversionContext, comment.likeableId, "Comments", lwComment._id);
  }
  
  // Print summary stats
  console.log(`Import found ${commentIdsToImport.length} normal comments and ${irregularComments.length} irregular comments`);
  const irregularCommentsByReason = groupBy(irregularComments, c=>c.reason)
  console.log(Object.keys(irregularCommentsByReason)
    .map((reason) => `${irregularCommentsByReason[reason].length}: ${reason}`)
    .join("\n")
  );
  
  // Update Algolia index for imported comments
  // The createMutator will have already created index entries via callbacks,
  // but after creating them we backdated them, so the dates in the index are
  // wrong.
  await updateElasticSearchForIds("Comments", commentIdsToReindexInElastic);
}

async function updateElasticSearchForIds(collectionName: SearchIndexCollectionName, documentIds: string[]): Promise<void> {
  const elasticExporter = new ElasticExporter();
  const uniqueIds = uniq(documentIds);
  await executePromiseQueue(uniqueIds.map(documentId => () => {
    return elasticExporter.updateDocument(collectionName, documentId);
  }), 10);
}

async function createRedLinkPlaceholders(redLinks: RedLinksSet, conversionContext: ArbitalConversionContext) {
  console.log("Creating placeholders for redlinks");
  
  // Group red-links by slug
  const redLinksBySlug = groupBy(redLinks, redLink=>redLink.slug);
  await executePromiseQueue(Object.keys(redLinksBySlug).map((slug) => async () => {
    // Check whether a redlink placeholder page already exists for this slug
    const existingPlaceholderPage = await Tags.findOne({slug, deleted: false});
    if (existingPlaceholderPage) {
      return;
    }

    // Check whether the red-links all agree on the title and warn if not
    const possibleTitles = redLinksBySlug[slug].map(r=>r.title);
    const selectedTitle = possibleTitles[0]; // TODO
    const capitalizedTitle = selectedTitle.substring(0,1).toUpperCase() + selectedTitle.substring(1);
    
    // Create the page
    console.log(`Creating redlink placeholder page ${slug}: ${selectedTitle} (referenced from ${redLinksBySlug[slug].map(r=>r.referencedFromPage)})`);
    await createMutator({
      collection: Tags,
      document: {
        name: capitalizedTitle,
        slug,
        description: {
          originalContents: {
            type: "ckEditorMarkup",
            data: "",
          }
        },
        isPlaceholderPage: true,
        wikiOnly: true,
      },
      currentUser: conversionContext.defaultUser,
      validate: false,
    });
  }), conversionContext.options.parallelism ??1);
}

export const deleteRedLinkPlaceholders = async (options: ArbitalImportOptions) => {
  const redLinkPlaceholderPagesToDelete = await Tags.find({
    isPlaceholderPage: true,
    deleted: false,
  }).fetch();
  await executePromiseQueue(redLinkPlaceholderPagesToDelete.map(wikiPage => async () => {
    await Tags.rawUpdateOne({
      _id: wikiPage._id,
    }, {
      "$set": {
        slug: `deleted-import-${randomId()}`,
        deleted: true,
      },
    });
  }), options.parallelism ?? 5);
}

export const deleteExcessRedLinkPlaceholders = async () => {
  const redLinkPlaceholderPages = await Tags.find({
    isPlaceholderPage: true,
    deleted: false,
  }).fetch();
  const redLinkPlaceholderPagesByUnnumberedSlug = groupBy(redLinkPlaceholderPages, t=>removeNumberFromSlug(t.slug));
  const redLinkPlaceholderPagesToDelete = flatMap(redLinkPlaceholderPagesByUnnumberedSlug , group =>
    group.length > 1
      ? sortBy(group, g=>g.createdAt).slice(1)
      : []
  );
  console.log(`Will delete ${redLinkPlaceholderPagesToDelete.length}/${redLinkPlaceholderPages.length} placeholder pages`);

  for (const wikiPage of redLinkPlaceholderPagesToDelete) {
    await Tags.rawUpdateOne({
      _id: wikiPage._id,
    }, {
      "$set": {
        slug: `deleted-import-${randomId()}`,
        deleted: true,
      },
    });
  }
}

function removeNumberFromSlug(slug: string): string {
  const dashedGroups = slug.split('-');
  if (dashedGroups.length <= 1) return slug;
  if (/[1-9][0-9]*/.test(dashedGroups[dashedGroups.length-1])) {
    return dashedGroups.slice(0, dashedGroups.length-1).join("-");
  } else {
    return slug;
  }
}


async function backDateObj<N extends CollectionNameString>(collection: CollectionBase<N>, _id: string, date: Date) {
  await collection.rawUpdateOne(
    {_id},
    {$set: {
      createdAt: date,
    }}
  );
}

async function backDateDenormalizedEditable<N extends CollectionNameString>(collection: CollectionBase<N>, _id: string, fieldName: string, date: Date) {
  await runSqlQuery(`
    UPDATE "${collection.collectionName}"
    SET "${fieldName}" = jsonb_set(
      "description",
      '{editedAt}',
      to_jsonb($2::timestamp)
    )
    WHERE "_id" = $1
  `, [_id, date]);
}

async function backDateRevision(_id: string, date: Date) {
  await Revisions.rawUpdateOne(
    {_id},
    {$set: {
      createdAt: date,
      editedAt: date,
    }}
  );
}
async function backDateAndAddLegacyDataToRevision(_id: string, date: Date, legacyData: any) {
  await Revisions.rawUpdateOne(
    {_id},
    {$set: {
      createdAt: date,
      editedAt: date,
      legacyData,
    }}
  );
}

async function convertLikesToVotes(conversionContext: ArbitalConversionContext, arbitalLikeableId: number, collectionName: VoteableCollectionName, documentId: string) {
  // TODO: Check that the execution-order of votes comes out right. There
  // have been voting bugs in the past related to votes being cast
  // simultaneously and hitting concurrency issues.

  const applicableLikes = conversionContext.database.likes.filter(like => like.likeableId === arbitalLikeableId);
  const sortedLikes = sortBy(applicableLikes, l=>l.updatedAt);
  const collection = getCollection(collectionName);
  let first = true;

  for (const like of sortedLikes) {
    if (like.value === -1) {
      // Redlinks and change-requests can have downvotes, but we don't handle those.
      continue;
    }
    if (like.value === 0) {
      // A cancelled like
      continue;
    }
    
    const user = conversionContext.matchedUsers[like.userId];
    if (!user) {
      console.error(`Could not find user ${like.userId} for like on ${arbitalLikeableId}`);
      continue;
    }
    
    const { vote } = await performVoteServer({
      collection,
      user,
      voteType: "bigUpvote",
      extendedVote: (collectionName === "Comments" ? {
        reacts: [{
          react: "thumbs-up",
          vote: first ? "created" : "seconded",
        }]
      } : null),
      selfVote: false,
      documentId,
      skipRateLimits: true,
      toggleIfAlreadyVoted: false,
    });
    if (vote) {
      await Votes.rawUpdateOne(
        { _id: vote._id },
        {$set:{
          votedAt: like.updatedAt,
          createdAt: like.updatedAt,
          legacyData: {
            arbitalUpdatedAt: like.updatedAt,
            arbitalLikeableId,
          }
        }},
      );
    }
    first = false;
  }
}

/**
 * Given an object which has been imported with only its first revision, add the
 * other revisions.
 */
async function importRevisions<N extends CollectionNameString>({
  collection, fieldName, documentId, pageId, revisions, oldestRevCkEditorMarkup, conversionContext, resolverContext,
}: {
  collection: CollectionBase<N>,
  fieldName: string,
  documentId: string,
  pageId: string,
  revisions: PagesRow[],
  oldestRevCkEditorMarkup: string,
  conversionContext: ArbitalConversionContext,
  resolverContext: ResolverContext,
}) {
  if (!revisions.length) {
    return;
  }
  console.log(`Importing ${revisions.length} revisions of ${collection.collectionName}.${fieldName}:${pageId}`);
  const ckEditorMarkupByRevisionIndex = await asyncMapSequential(revisions,
    (rev) => arbitalMarkdownToCkEditorMarkup({
      markdown: rev.text, pageId,
      conversionContext,
      convertedPage: rev,
    })
  );
  for (let i=0; i<revisions.length-1; i++) {
    const arbRevision = revisions[i];
    const ckEditorMarkup = ckEditorMarkupByRevisionIndex[i];
    const revisionCreator = conversionContext.matchedUsers[arbRevision.creatorId] ?? conversionContext.defaultUser;

    const lwRevision = (await createMutator({
      collection: Revisions,
      document: {
        ...await buildRevision({
          originalContents: {
            type: "ckEditorMarkup",
            data: ckEditorMarkup,
          },
          currentUser: revisionCreator,
        }),
        fieldName,
        collectionName: collection.collectionName,
        documentId: documentId,
        commitMessage: arbRevision.editSummary,
        version: `1.${i+1}.0`,
        changeMetrics: htmlToChangeMetrics(i>0 ? ckEditorMarkupByRevisionIndex[i-1] : oldestRevCkEditorMarkup, ckEditorMarkup),
        legacyData: {
          "arbitalPageId": pageId,
          "arbitalEditNumber": arbRevision.edit,
          "arbitalMarkdown": arbRevision.text,
        },
      },
      currentUser: revisionCreator,
      validate: false,
    })).data;
    await backDateRevision(lwRevision._id, arbRevision.createdAt);
    await afterCreateRevisionCallback.runCallbacksAsync([{
      revisionID: lwRevision._id,
      skipDenormalizedAttributions: true,
    }]);
  }
  
  // Handle the last revision separately, as an edit-operation rather than a
  // revision-insert operation, so that callbacks on the tag object trigger.
  const lastRevision = revisions[revisions.length-1];
  const lastRevCkEditorMarkup = ckEditorMarkupByRevisionIndex[revisions.length-1];
  const lastRevisionCreator = conversionContext.matchedUsers[lastRevision.creatorId] ?? conversionContext.defaultUser;
  const modifiedObj = (await updateMutator<N>({
    collection,
    documentId,
    set: {
      [fieldName]: {
        originalContents: {
          type: "ckEditorMarkup",
          data: lastRevCkEditorMarkup,
        }
      },
    } as AnyBecauseHard,
    currentUser: lastRevisionCreator,
    context: resolverContext,
    validate: false,
  })).data;
  if (collection.collectionName === "Tags") {
    await backDateDenormalizedEditable(collection, documentId, fieldName, lastRevision.createdAt);
  }
  await backDateAndAddLegacyDataToRevision((modifiedObj as any)[`${fieldName}_latest`], lastRevision.createdAt, {
    "arbitalPageId": pageId,
    "arbitalEditNumber": lastRevision.edit,
    "arbitalMarkdown": lastRevision.text,
  });
}

async function printTablesAndStats(connection: mysql.Connection): Promise<void> {
  // Get list of tables
  const [tables] = await connection.query('SHOW TABLES');

  // Iterate through each table
  for (const table of tables as any[]) {
    const tableName = Object.values(table)[0] as string;

    // Get row count for the current table
    const [rows] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    const rowCount = (rows as any[])[0].count;

    console.log(`Table: ${tableName}, Row Count: ${rowCount}`);
  }
}

async function loadUserMatching(csvFilename: string): Promise<Record<string,DbUser|null>> {
  const parsedCsv = loadUsersCsv(csvFilename);
  const lwUserSlugs = parsedCsv.data.map(row => (row as any).lwUserSlug).filter(userSlug => !!userSlug);
  const lwUsers = await Users.find({
    slug: {$in: lwUserSlugs}
  }).fetch();
  console.log(`Loaded ${lwUsers.length} users with matching slugs`);
  const lwUsersBySlug = keyBy(lwUsers, u=>u.slug);
  const unmatchedSlugs: string[] = [];

  const result = Object.fromEntries(parsedCsv.data.map(row => {
    const {arbitalUserId, lwUserSlug} = (row as any);
    const slug = lwUserSlug
    const user = lwUsersBySlug[slug] ?? null;
    if (!user) unmatchedSlugs.push(slug);
    return [arbitalUserId, user]
  }));
  
  if (unmatchedSlugs.length > 0) {
    console.warn(`${unmatchedSlugs.length}/${parsedCsv.data.length} users did not have corresponding accounts for import`);
    console.warn(`Unmatched: ${unmatchedSlugs.join(", ")}`);
  }
  
  return result;
}

async function moveFieldsOnMergedPage({lwWikiPage, mergedPage}: {
  lwWikiPage: DbTag
  mergedPage: DbTag
}) {
  const fieldsToCopy: Array<keyof DbTag> = [
    // Contentful fields
    "core", "suggestedAsFilter", "defaultOrder", "descriptionTruncationCount", "adminOnly",
    "canEditUserIds", "needsReview", "reviewedByUserId", "wikiGrade", "postsDefaultSortOrder",
    "canVoteOnRels", "autoTagModel", "autoTagPrompt", "noindex",

    // Denormalized fields
    "postCount", "lastCommentedAt", "lastSubforumCommentAt"

    // EA Forum-only fields
    // isSubforum, subforumModeratorIds, subforumIntroPostId, 

    // Dead fields
    // charsAdded, charsRemoved, introSequenceId
  ];
  
  await Tags.rawUpdateOne(
    {_id: mergedPage._id},
    {$set: Object.fromEntries(fieldsToCopy.map(fieldName => [fieldName, lwWikiPage[fieldName]]))
    }
  );
}

async function moveReferencesToMergedPage({oldTagIds, newTagId}: {
  oldTagIds: string[]
  newTagId: string
}) {
  async function redirectTagReferences<N extends CollectionNameString>(collectionName: N, fieldName: keyof ObjectsByCollectionName[N]) {
    const collection = getCollection(collectionName);
    await collection.rawUpdateMany(
      {
        [fieldName]: {$in: oldTagIds}
      },
      {$set: {
        [fieldName]: newTagId,
      }},
    );
  }

  await redirectTagReferences("TagRels", "tagId");
  await redirectTagReferences("Comments", "tagId");
  await redirectTagReferences("UserTagRels", "tagId");
  await redirectTagReferences("Subscriptions", "documentId");
  
  // TODO: Rewrite user tag filters?
  
  // Rewrite tagRelevance on posts that reference any redirect tags
  const postIdsToRecomputeTagRelevance: string[] = (await runSqlQuery(`
    SELECT _id
    FROM "Posts"
    WHERE "tagRelevance" ?| $1
  `, [oldTagIds])).map(row => row._id);
  console.log(`Rewriting tagRelevance on ${postIdsToRecomputeTagRelevance} posts`);

  await executePromiseQueue(postIdsToRecomputeTagRelevance.map((postId) => async () => {
    await updatePostDenormalizedTags(postId)
  }), 5);
}

/**
 * Load accounts from the Arbital DB, match them by email address to LW
 * accounts, and produce a CSV with the results display-names of matched
 * accounts. This must be manually reviewed before using it for a user-visible
 * import, because neither site makes the email addresses visible, and it's
 * possible that one side of the match is pseudonymous and the other isn't. But
 * we also can't just string-match display names and reject all
 * account-matchings where they differ, because they will often differ in
 * trivial ways (eg First Last vs FirstLast), or one of them may be a
 * nickname that they map to their real name publicly.
 */
export const matchArbitalToLWAccounts = async (mysqlConnectionString: string, outputCsvFilename: string) => {
  const arbitalDb = await connectAndLoadArbitalDatabase(mysqlConnectionString);
  const usersRepo = new UsersRepo();
  
  console.log(`Matching Arbital users to LW users and saving results in ${outputCsvFilename}`);
  const headerRow = ["arbitalUserId", "arbitalEmail", "arbitalName", "lwUserSlug", "lwDisplayName", "lwFullName", "comment"];
  let skippedUsers = 0;
  const unmatchedUserRows: string[][] = [];
  const matchedUserRows: string[][] = [];
  const pageEditCount = Object.fromEntries(arbitalDb.users.map(u => [u.id, countArbitalPageEditsByUser(arbitalDb, u.id)]));
  const usersByPageEditsDescending = sortBy(arbitalDb.users, u => -pageEditCount[u.id]);
  
  for (const arbitalUser of usersByPageEditsDescending) {
    if (!shouldIncludeArbitalUser(arbitalDb, arbitalUser.id)) {
      skippedUsers++;
      continue;
    }

    const lwUser = await usersRepo.getUserByEmail(arbitalUser.email)
    const isMatch = !!lwUser && !lwUser.deleted;
    
    (isMatch ? matchedUserRows : unmatchedUserRows).push([
      arbitalUser.id,
      arbitalUser.email,
      `${arbitalUser.firstName} ${arbitalUser.lastName}`,
      (isMatch && lwUser?.slug) || "",
      (isMatch && lwUser?.displayName) || "",
      (isMatch && lwUser?.fullName) || "",
      `${pageEditCount[arbitalUser.id]} contributions`,
    ]);
  }
  
  const allRows = [headerRow, ...matchedUserRows, ...unmatchedUserRows];
  fs.writeFileSync(outputCsvFilename, Papa.unparse(allRows));
  console.log(`Matched Arbital users to LW users. Matched: ${matchedUserRows.length}, unmatched: ${unmatchedUserRows.length}, skipped: ${skippedUsers}`);
}

function countArbitalPageEditsByUser(arbitalDb: WholeArbitalDatabase, arbitalUserId: string): number {
  let result = 0;
  for (const page of arbitalDb.pages) {
    if (page.creatorId === arbitalUserId && !page.isAutosave && page.pageId !== arbitalUserId) {
      const pageId = page.pageId;
      const pageInfo = arbitalDb.pageInfos.find(pi => pi.pageId === pageId);
      if (pageInfo && !pageInfo.isDeleted) {
        result++;
      }
    }
  }
  return result;
}

/**
 * Return whether an Arbital user has any contributions of content that will be
 * imported (as opposed to an account that has only read things, and not
 * written or voted on anything).
 */
function shouldIncludeArbitalUser(arbitalDb: WholeArbitalDatabase, arbitalUserId: string): boolean {
  // Check for edits in the pages collection, excluding autosaves, edits to
  // deleted pages, and edits where the text is "Automatically generated page for [user]".
  if (countArbitalPageEditsByUser(arbitalDb, arbitalUserId) > 0)
    return true;
  // Check for objects in other collections with this user's userId, excluding
  // some tables
  // Skip domainMembers, lastViews, lastVisits, maintainerSubscriptions, pathInstances, searchStrings, updates, userMasteryPairs, userPageObjectPairs, userRequisitePairSnapshots, visits
  if (arbitalDb.answers.some(r => r.userId === arbitalUserId)) {
    return true;
  }
  // Exclude changeLogs where the pageId is the user's own profile page (happens automatically during signup)
  if (arbitalDb.changeLogs.some(r => r.userId === arbitalUserId && r.pageId !== arbitalUserId)) {
    return true;
  }
  if (arbitalDb.pagePairs.some(r => r.creatorId === arbitalUserId)) {
    return true;
  }
  if (arbitalDb.likes.some(r => r.userId === arbitalUserId)) {
    return true;
  }
  if (arbitalDb.votes.some(r => r.userId === arbitalUserId)) {
    return true;
  }

  // If none of the above apply, this user doesn't have any content to import,
  // so we shouldn't include them when producing the account-mappings list for
  // review.
  return false;
}

/**
 * Load accounts from a CSV file generated by matchArbitalToLWAccount (above),
 * create accounts for any Arbital users that don't already have a
 * corresponding LW account, and rewrite the CSV file (in place) to include
 * these placeholder accounts.
 */
export const createImportAccounts = async (csvFilename: string) => {
  const parsedCsv = loadUsersCsv(csvFilename);
  const rows = parsedCsv.data;
  const rewrittenCsvRows: string[][] = [
    ["arbitalUserId", "arbitalEmail", "arbitalName", "lwUserSlug", "lwDisplayName", "lwFullName", "comment"]
  ];
  let usersAlreadyMatchedCount = 0;
  let usersAlreadyImportedCount = 0;
  let usersCreatedCount = 0;
  let userNamesUsed = new Set<string>();

  for (const row of rows) {
    const {arbitalUserId, arbitalEmail, arbitalName, lwUserSlug, lwDisplayName, lwFullName, comment} = (row as any);
    
    if (lwUserSlug) {
      // CSV already has an LW account match
      rewrittenCsvRows.push([
        arbitalUserId, arbitalEmail, arbitalName,
        lwUserSlug, lwDisplayName, lwFullName, comment
      ]);
      usersAlreadyMatchedCount++;
    } else {
      // First check whether there's an LW user from a previous run of the import script
      const existingLwUser = await Users.findOne({
        "legacyData.arbitalUserId": arbitalUserId,
        deleted: false,
      });
      if (existingLwUser) {
        rewrittenCsvRows.push([
          arbitalUserId, arbitalEmail, arbitalName,
          existingLwUser.slug, existingLwUser.displayName, existingLwUser.fullName, comment
        ]);
        usersAlreadyImportedCount++;
      } else {
        // Otherwise create an LW user
        
        // Give them a username of the form ArbitalImport-[slugified-name]
        // This may collide; there are some people with multiple accounts with
        // the same name on Arbital. When that happens, add a numeric suffix.
        let username = `ArbitalImport-${slugify(arbitalName)}`;
        let i=0;
        while (userNamesUsed.has(username)) {
          username = `ArbitalImport-${slugify(arbitalName)}-${++i}`
        }
        userNamesUsed.add(username);

        const lwUser = (await createMutator({
          collection: Users,
          document: {
            username: username,
            displayName: arbitalName,
            emailSubscribedToCurated: false,
            legacyData: {
              arbitalUserId,
            },
          },
          validate: false,
          currentUser: null,
        })).data;
        usersCreatedCount++;
        rewrittenCsvRows.push([
          arbitalUserId, arbitalEmail, arbitalName,
          lwUser.slug, lwUser.displayName, lwUser.fullName, comment
        ]);
      }
    }
  }
  fs.writeFileSync(csvFilename, Papa.unparse(rewrittenCsvRows));
  console.log(`Finished. Created ${usersCreatedCount} users; found ${usersAlreadyImportedCount} already-created imported users in the DB; ignored ${usersAlreadyMatchedCount} already matched in the CSV.`);
}

function loadUsersCsv(filename: string) {
  const csvStr = fs.readFileSync(filename, 'utf-8');
  const parsedCsv = Papa.parse(csvStr, {
    delimiter: ',',
    header: true,
    skipEmptyLines: true,
  });
  if (parsedCsv.errors?.length > 0) {
    for (const error of parsedCsv.errors) {
      console.error(`${error.row}: ${error.message}`);
    }
    throw new Error("Error parsing CSV");
  }
  return parsedCsv;
}

export const domainStats = async (mysqlConnectionString: string) => {
  const arbitalDb = await connectAndLoadArbitalDatabase(mysqlConnectionString);
  const pageIdsToHide = arbitalDb.pageInfos.filter(pi => pi.seeDomainId !== 0);
  console.log(`${pageIdsToHide.length}/${arbitalDb.pageInfos.length} pages hidden based on domain`);
}

export const hideContentFromNonDefaultDomains = async (mysqlConnectionString: string) => {
  const arbitalDb = await connectAndLoadArbitalDatabase(mysqlConnectionString);
  
  const pageIdsToDelete = arbitalDb.pageInfos.filter(pi => pi.seeDomainId !== 0).map(pi => pi.pageId);
  console.log(`Will delete ${pageIdsToDelete.length} pages`);
  
  await executePromiseQueue(pageIdsToDelete.map((pageId) => async () => {
    await Tags.rawUpdateMany(
      { "legacyData.arbitalPageId": pageId },
      { $set: { deleted: true }}
    );
  }), 10);
}


function isMultiDocument(doc: DbTag | DbMultiDocument): doc is DbMultiDocument {
  return 'title' in doc;
}

async function findValidMultiDocument(arbitalLensId: string): Promise<DbMultiDocument | null> {
  const multiDocs = await MultiDocuments.find({ 'legacyData.arbitalLensId': arbitalLensId, fieldName: 'description' }).fetch();
  for (const multiDoc of multiDocs) {
    const parentTagExists = await Tags.findOne({ _id: multiDoc.parentDocumentId, deleted: false });
    if (parentTagExists) {
      return multiDoc;
    }
  }
  return null;
}

// Function to undo the deletion of imported wiki pages
export const undoDeleteImportedArbitalWikiPages = async () => {
  // Find all deleted wiki pages that were originally imported from Arbital
  const deletedWikiPages = await Tags.find({
    "legacyData.arbitalPageId": { $exists: true },
    deleted: true,
  }).fetch();

  // Group pages by Arbital Page ID to identify duplicates
  const pagesByArbitalPageId = groupBy(
    deletedWikiPages,
    (page) => page.legacyData.arbitalPageId
  );
  
  console.log(`Found ${Object.keys(pagesByArbitalPageId).length} duplicate deleted wiki pages to restore`);

  for (const arbitalPageId in pagesByArbitalPageId) {
    const pages = pagesByArbitalPageId[arbitalPageId];

    // Select the page with the most recent createdAt
    const pageToRestore = pages.reduce((a, b) =>
      a.createdAt > b.createdAt ? a : b
    );

    console.log(`Restoring page ${pageToRestore.name}`);

    // Reconstruct the slug from the page name
    const slug = await getUnusedSlugByCollectionName(
      "Tags",
      slugify(pageToRestore.name)
    );

    // Restore the selected page and set the new slug in a single operation
    await Tags.rawUpdateOne(
      { _id: pageToRestore._id },
      {
        $set: { 
          deleted: false,
          slug 
        }
      }
    );

    // Non-restored duplicates are left as is
    // We do not modify or remove them
  }
};


async function importPagePairs(
  database: WholeArbitalDatabase,
  resolverContext: ResolverContext,
  options: ArbitalImportOptions
): Promise<void> {
  // Replicating here rather than using buildConversionContext to avoid unintended side effects
  const pageInfosById = keyBy(database.pageInfos, pi => pi.pageId);
  const defaultUser: DbUser | null = await Users.findOne({ username: "arbitalimport" });
  if (!defaultUser) {
    throw new Error("There must be a fallback user named arbitalimport to assign edits to");
  }

  console.log("Truncating ArbitalTagContentRels collection");
  await ArbitalTagContentRels.rawRemove({});

  console.log("Importing page pairs");

  const filteredPagePairs = database.pagePairs.filter(pair => {
    const { parentId, childId, type } = pair;

    // First check if we should include this pair based on the pages option
    if (options.pages && !options.pages.includes(childId)) {
      return false;
    }

    const validType = ['tag', 'subject', 'requirement', 'parent'].includes(type);
    const parentInfo = pageInfosById[parentId];
    const childInfo = pageInfosById[childId];
    const pagesExist = parentInfo && childInfo;
    const pagesNotDeleted = pagesExist && !parentInfo.isDeleted && !childInfo.isDeleted;
    const pagesAreWikis = pagesExist && parentInfo.type === 'wiki' && childInfo.type === 'wiki';

    return validType && pagesExist && pagesNotDeleted && pagesAreWikis;
  });

  console.log(`Importing ${filteredPagePairs.length} page pairs`);

  const arbitalTagContentRels: Array<Omit<DbArbitalTagContentRel, '_id'>> = [];

  for (const pair of filteredPagePairs) {
    const { parentId, childId, type, level, isStrong, createdAt } = pair;

    // Updated code begins here
    // Function to find a valid MultiDocument associated with a non-deleted Tag


    // Find both MultiDocuments and Tags in parallel
    const [
      parentMultiDoc,
      childMultiDoc,
      parentTagDirect,
      childTagDirect
    ] = await Promise.all([
      findValidMultiDocument(parentId),
      findValidMultiDocument(childId),
      Tags.findOne({ 'legacyData.arbitalPageId': parentId, deleted: false }),
      Tags.findOne({ 'legacyData.arbitalPageId': childId, deleted: false })
    ]);

    // Use the MultiDocument if it exists, otherwise use the Tag
    const parentDoc = parentMultiDoc ?? parentTagDirect;
    const childDoc = childMultiDoc ?? childTagDirect;
    const parentCollectionName = parentMultiDoc ? 'MultiDocuments' : 'Tags';
    const childCollectionName = childMultiDoc ? 'MultiDocuments' : 'Tags';

    if (!parentDoc || !childDoc) {
      console.log(`Skipping page pair ${pair.id} because ${
        !parentDoc ? `parentDoc (${parentId}) is missing` : ''
      }${
        !parentDoc && !childDoc ? ' and ' : ''
      }${
        !childDoc ? `childDoc (${childId}) is missing` : ''
      }`);
      continue;
    }

    let mappedType: DbArbitalTagContentRel['type'] | null = null;
    switch (type) {
      case 'requirement':
        mappedType = 'parent-is-requirement-of-child';
        break;
      case 'subject':
        mappedType = 'parent-taught-by-child';
        break;
      case 'tag':
        mappedType = 'parent-is-tag-of-child';
        break;
      case 'parent':
        mappedType = 'parent-is-parent-of-child';
        break;
      default:
        continue;
    }

    console.log(`Queueing relationship ${
      isMultiDocument(parentDoc) ? parentDoc.title : parentDoc.name
    } -> ${
      isMultiDocument(childDoc) ? childDoc.title : childDoc.name
    } with type ${mappedType}`);


    arbitalTagContentRels.push({
      parentDocumentId: parentDoc._id,
      childDocumentId: childDoc._id,
      parentCollectionName,
      childCollectionName,
      type: mappedType,
      level: mappedType === 'parent-is-parent-of-child' ? 0 : level,
      isStrong: mappedType === 'parent-is-parent-of-child' ? false : !!isStrong,
      createdAt,
      legacyData: {
        arbitalPagePairId: pair.id,
      },
      schemaVersion: 1,
    });
  }

  // Bulk insert the relationships
  if (arbitalTagContentRels.length > 0) {
    console.log(`Bulk importing ${arbitalTagContentRels.length} pagePairs into ArbitalTagContentRels`);
    
    // Process in chunks to avoid overwhelming the database
    const chunkSize = 100;
    for (let i = 0; i < arbitalTagContentRels.length; i += chunkSize) {
      const chunk = arbitalTagContentRels.slice(i, i + chunkSize);
      await Promise.all(chunk.map(rel => 
        createMutator({
          collection: ArbitalTagContentRels,
          document: rel,
          validate: false,
          context: resolverContext,
          currentUser: defaultUser,
        })
      ));
      console.log(`Imported chunk ${Math.floor(i/chunkSize) + 1}/${Math.ceil(arbitalTagContentRels.length/chunkSize)}`);
    }
  }
}


async function doCleanUpAccidentalLensTags(wholeArbitalDb: WholeArbitalDatabase) {
  const lensIds = Array.from(new Set(wholeArbitalDb.lenses.map(l => l.lensId)));
  await executePromiseQueue(lensIds.map(id => () => Tags.rawUpdateOne({
    "legacyData.arbitalPageId": id,
    deleted: false,
  }, {
    $set: {
      slug: `deleted-import-${randomId()}`,
      deleted: true,
      },
    })
  ), 10);
}

export const cleanUpAccidentalLensTags = async (mysqlConnectionString: string) => {
  const arbitalDb = await connectAndLoadArbitalDatabase(mysqlConnectionString);
  await doCleanUpAccidentalLensTags(arbitalDb);
};

export const checkAccidentalLensTags = async (mysqlConnectionString: string) => {
  const arbitalDb = await connectAndLoadArbitalDatabase(mysqlConnectionString);
  const lensIds = Array.from(new Set(arbitalDb.lenses.map(l => l.lensId)));
  const tags = await executePromiseQueue(lensIds.map(id => () => Tags.findOne({
    deleted: false,
    "legacyData.arbitalPageId": id
  })), 10);

  tags.forEach(tag => {
    console.log(`${tag?.name} (${tag?.slug}) is an accidental lens tag`);
  });
};

/**
 * Find imported lenses and change legacyData->>'arbitalPageId' to the lens ID.
 * Run this to fix an earlier import where that field was populated by the ID
 * of the page that the lens is on, rather than the lens ID.
 */
export const updateLensIds = async (mysqlConnectionString: string) => {
  const arbitalDb = await connectAndLoadArbitalDatabase(mysqlConnectionString);
  
  const arbitalWikiPages = await Tags.find({
    deleted: false,
    "legacyData.arbitalPageId": {$exists: true},
  }).fetch();
  await executePromiseQueue(arbitalWikiPages.map((wikiPage) => async () => {
    const lenses = await MultiDocuments.find({
      "legacyData.arbitalPageId": {$exists: true},
      "parentDocumentId": wikiPage._id,
      "fieldName": "description",
    }).fetch();
    if (!lenses.length) {
      return;
    }
    
    console.log(`Page ${wikiPage.name} has ${lenses.length} lenses`);
    for (const lens of lenses) {
      // Find the corresponding lens ID by matching titles
      const wikiPageId = wikiPage.legacyData?.arbitalPageId;
      if (!wikiPageId) throw new Error("Found a wiki page without an arbitalPageId?");
      const arbitalLenses = arbitalDb.lenses.filter(arbLens => arbLens.pageId === wikiPageId);
      const matchingArbitalLenses = arbitalLenses.filter(arbLens => arbLens.lensName=== lens.tabTitle && arbLens.lensSubtitle===lens.tabSubtitle);
      if (matchingArbitalLenses.length !== 1) {
        console.error(`Didn't find a unique matching lens: found ${matchingArbitalLenses.length} matches`);
        for (const matchingLens of matchingArbitalLenses) {
          console.error(`    ${matchingLens.lensId} ${matchingLens.lensName}`);
        }
        throw new Error(`Didn't find a unique matching lens`);
      }
      const matchingArbitalLens = matchingArbitalLenses[0];
      console.log(`Lens ${wikiPage.name}/${lens.tabTitle}: Setting lensId=${matchingArbitalLens.lensId}`);

      await MultiDocuments.rawUpdateOne(
        {_id: lens._id},
        {$set: {
          "legacyData.arbitalLensId": matchingArbitalLens.lensId,
        }},
      );
    }
  }), 10);
}

function isImportablePage(pageId: string, conversionContext: ArbitalConversionContext) {
  const pageInfo = conversionContext.pageInfosByPageId[pageId];
  return pageInfo
    && pageInfo.type === 'wiki'
    && !pageInfo.isDeleted
    && pageInfo.seeDomainId === 0;
}

async function doCheckDefaultPageSummaries(database: WholeArbitalDatabase) {
  const conversionContext = await buildConversionContext(database, [], {});
  const { summariesByPageId, liveRevisionsByPageId } = conversionContext;
  const lensesByPageId = groupBy(database.lenses, l=>l.pageId);
  const lensIds = new Set(database.lenses.map(l=>l.lensId));

  const pageIdsToImport = Object.keys(liveRevisionsByPageId).filter(pageId => {
    return !lensIds.has(pageId) && isImportablePage(pageId, conversionContext);
  });

  console.log(`Checking ${pageIdsToImport.length} pages for default summaries`);

  const pagesWithNoSummaries: string[] = [];
  const pagesWithDefaultSummaries: string[] = [];
  const pagesWithNonDefaultSummaries: string[] = [];

  const lensesWithNoSummaries: string[] = [];
  const lensesWithDefaultSummaries: string[] = [];
  const lensesWithNonDefaultSummaries: string[] = [];

  for (const pageId of pageIdsToImport) {
    const livePage = liveRevisionsByPageId[pageId];
    const lenses = (lensesByPageId[pageId] ?? []).filter(l => isImportablePage(l.lensId, conversionContext));
    const summaries = summariesByPageId[pageId];

    if (summaries.length === 0) {
      pagesWithNoSummaries.push(pageId);
    } else if (summaries.length === 1) {
      const [summary] = summaries;
      
      if (livePage.text.startsWith(summary.text)) {
        pagesWithDefaultSummaries.push(pageId);
      } else {
        pagesWithNonDefaultSummaries.push(pageId);
      }
    } else {
      pagesWithNonDefaultSummaries.push(pageId);
    }

    try {
      for (const lens of lenses) {
        const lensPage = liveRevisionsByPageId[lens.lensId];
        const lensSummaries = summariesByPageId[lens.lensId];
        if (lensSummaries.length === 0) {
          lensesWithNoSummaries.push(lens.lensId);
        } else if (lensSummaries.length === 1) {
          const [summary] = lensSummaries;
          if (lensPage.text.startsWith(summary.text)) {
            lensesWithDefaultSummaries.push(lens.lensId);
          } else {
            lensesWithNonDefaultSummaries.push(lens.lensId);
          }
        } else {
          lensesWithNonDefaultSummaries.push(lens.lensId);
        }
      }
    } catch (e) {
      console.error(`Error processing lenses for page ${pageId}: ${e}`, { lenses });
    }
  }

  console.log(`Pages with default summaries: ${pagesWithDefaultSummaries.length}`);
  console.log(`Pages with non-default summaries: ${pagesWithNonDefaultSummaries.length}`);
  console.log(`Pages with no summaries: ${pagesWithNoSummaries.length}`);

  console.log(`Lenses with default summaries: ${lensesWithDefaultSummaries.length}`);
  console.log(`Lenses with non-default summaries: ${lensesWithNonDefaultSummaries.length}`);
  console.log(`Lenses with no summaries: ${lensesWithNoSummaries.length}`);
}

export const checkDefaultPageSummaries = async (mysqlConnectionString: string) => {
  const arbitalDb = await connectAndLoadArbitalDatabase(mysqlConnectionString);
  await doCheckDefaultPageSummaries(arbitalDb);
}

interface TagAssignment {
  slug: string;
  coreTagNames: string[];
}

function loadCoreTagAssignmentsCsv(filename: string) {
  const csvStr = fs.readFileSync(filename, 'utf-8');
  const parsedCsv = Papa.parse(csvStr, {
    delimiter: ',',
    header: true,
    skipEmptyLines: true,
  });
  if (parsedCsv.errors?.length > 0) {
    for (const error of parsedCsv.errors) {
      console.error(`${error.row}: ${error.message}`);
    }
    throw new Error("Error parsing CSV");
  }
  return parsedCsv;
}

export async function importCoreTagAssignments(coreTagAssignmentsFile: string) {
  await Tags.rawUpdateMany(
    { coreTagId: { $exists: true } },
    { $unset: { coreTagId: "" } }
  );

  // Fetch all core tags and map their names to their IDs
  const coreTags = await Tags.find({ core: true }).fetch();
  const coreTagNames = new Set(coreTags.map(ct => ct.name));
  const coreTagIdsByName = Object.fromEntries(coreTags.map(ct => [ct.name, ct._id]));

  const { data } = loadCoreTagAssignmentsCsv(coreTagAssignmentsFile);
  const tagAssignments: TagAssignment[] = data.map((row: AnyBecauseIsInput) => {
    return {
      slug: row.slug,
      coreTagNames: row['Core Tag'].split(', '),
    };
  });

  const filteredTagAssignments = tagAssignments.filter(ta => {
    const allCoreTagsExist = ta.coreTagNames.every(tag => coreTagNames.has(tag));
    const hasSingleCoreTag = ta.coreTagNames.length === 1;
    if (!hasSingleCoreTag) {
      console.warn(
        `Tag "${ta.slug}" has multiple core tags assigned (${ta.coreTagNames.join(', ')}). Only one core tag is supported per tag. Skipping this tag.`
      );
    }
    
    const isExcluded = ta.coreTagNames.includes("Exclude");
    return allCoreTagsExist && hasSingleCoreTag && !isExcluded;
  });

  console.log(`Found ${filteredTagAssignments.length} valid tag assignments with a single core tag.`);
  
  const excludedPages = tagAssignments.filter(ta => ta.coreTagNames.includes('Exclude'));
  console.log(`Found ${excludedPages.length} tags marked as excluded from import`);

  await executePromiseQueue(excludedPages.map(ta => async () => {
    const tag = await Tags.findOne({ $or: [{ slug: ta.slug }, { oldSlugs: ta.slug }], deleted: false });
    if (!tag) {
      console.warn(`Excluded tag with slug "${ta.slug}" not found. Skipping.`);
      return;
    }
    await Tags.rawUpdateOne(
      { _id: tag._id },
      { $set: {
        deleted: true
      }}
    );
  }), 10);

  // Update each tag's coreTagId field
  await executePromiseQueue(filteredTagAssignments.map(ta => async () => {
    const tag = await Tags.findOne({ $or: [{ slug: ta.slug }, { oldSlugs: ta.slug }], deleted: false });
    if (!tag) {
      console.warn(`Tag with slug "${ta.slug}" not found. Skipping.`);
      return;
    }

    let coreTagName = ta.coreTagNames[0];
    // TODO: make a decision about this later
    if (coreTagName === 'Math') {
      coreTagName = 'World Modeling';
    }
    const coreTagId = coreTagIdsByName[coreTagName];
    if (!coreTagId) {
      console.warn(`Core tag "${coreTagName}" not found. Skipping.`);
      return;
    }

    // Update the tag's coreTagId field
    await Tags.rawUpdateOne(
      { _id: tag._id },
      { $set: { coreTagId } }
    );

    console.log(`Assigned coreTagId "${coreTagId}" to tag "${tag.name}" (${tag.slug}).`);
  }), 10);

  console.log(`Assigned core tags to ${filteredTagAssignments.length} tags.`);
}


async function importSingleLens({conversionContext, lens, parentTagId, resolverContext, lensCreator}: {
  conversionContext: ArbitalConversionContext,
  lens: LensesRow,
  parentTagId: string
  resolverContext: ResolverContext,
  lensCreator: DbUser,
}) {
  const lensId = lens.lensId;
  const {
    database, options,
    pageInfosByPageId: pageInfosById, slugsByPageId, summariesByPageId, titlesByPageId,
    pageIdsByTitle, domainsByPageId, matchedUsers, defaultUser, liveRevisionsByPageId,
    pagesToConvertToLenses,
  } = conversionContext;

  const lensPageInfo = pageInfosById[lens.lensId];
  if (!lensPageInfo || lensPageInfo.isDeleted) {
    return;
  }

  const lensAliasRedirects = database.aliasRedirects.filter(ar => ar.newAlias === lensPageInfo.alias);
  const lensSlug = slugsByPageId[lens.lensId];
  const lensRevisions = database.pages.filter(p => p.pageId === lens.lensId);
  const lensFirstRevision = lensRevisions[0];
  const lensLiveRevision = liveRevisionsByPageId[lens.lensId];
  const oldLensSlugs = [lensPageInfo.alias, ...lensAliasRedirects.map(ar => ar.oldAlias), lens.lensId];
  const lensTitle = lensLiveRevision.title;
  const lensFirstRevisionCkEditorMarkup = await arbitalMarkdownToCkEditorMarkup({
    markdown: lensFirstRevision.text,
    pageId: lens.lensId,
    conversionContext,
    convertedPage: lensFirstRevision,
  });

  // Create the lens, with the oldest revision
  let lensObj: DbMultiDocument|null;
  if (!options.skipImportingPages) {
    lensObj = (await createMutator({
      collection: MultiDocuments,
      document: {
        parentDocumentId: parentTagId,
        collectionName: "Tags",
        fieldName: "description",
        title: lensTitle,
        slug: lensSlug,
        oldSlugs: oldLensSlugs,
        //FIXME: preview/clickbait, tab-title, and subtitle need edit history/etc
        preview: lensLiveRevision.clickbait,
        tabTitle: lens.lensName,
        tabSubtitle: lens.lensSubtitle,
        userId: lensCreator?._id,
        index: lens.lensIndex,
        contents: {
          originalContents: {
            type: "ckEditorMarkup",
            data: lensFirstRevisionCkEditorMarkup,
          }
        },
        legacyData: {
          arbitalPageId: lens.pageId,
          arbitalLensId: lens.lensId,
        },
      } as Partial<DbMultiDocument>,
      context: resolverContext,
      currentUser: lensCreator,
      validate: false,
    })).data;
    await Promise.all([
      backDateObj(MultiDocuments, lensObj._id, lensFirstRevision.createdAt),
      backDateAndAddLegacyDataToRevision(lensObj.contents_latest!, lensFirstRevision.createdAt, {
        arbitalPageId: lens.lensId,
        arbitalEditNumber: lensFirstRevision.edit,
        arbitalMarkdown: lensFirstRevision.text,
      }),
    ]);
    
    await importRevisions({
      collection: MultiDocuments,
      fieldName: "contents",
      documentId: lensObj._id,
      pageId: lens.lensId,
      revisions: lensRevisions.slice(1),
      oldestRevCkEditorMarkup: lensFirstRevisionCkEditorMarkup,
      conversionContext: conversionContext,
      resolverContext,
    });
    
    await convertLikesToVotes(conversionContext, pageInfosById[lens.lensId].likeableId, "MultiDocuments", lensObj._id);

  } else {
    lensObj = await MultiDocuments.findOne({ slug: lensSlug });
    if (!lensObj) {
      console.log(`Lens not found: ${lensSlug}`);
      return
    }
  }

  /*const lensAlternatives = alternativesByPageId[lens.lensId];
  if (lensAlternatives && Object.values(lensAlternatives).some(alternatives => alternatives.length > 0)) {
    await updateMutator({
      collection: MultiDocuments,
      documentId: lensObj._id,
      set: {
        legacyData: {
          ...lensObj.legacyData,
          arbitalPageId: lens.lensId,
          arbitalFasterAlternatives: lensAlternatives.faster ?? [],
          arbitalSlowerAlternatives: lensAlternatives.slower ?? [],
          arbitalMoreTechnicalAlternatives: lensAlternatives.more_technical ?? [],
          arbitalLessTechnicalAlternatives: lensAlternatives.less_technical ?? [],
        },
      },
    });
  }*/

  await createSummariesForPage({
    pageId: lens.lensId,
    importedRecordMaps: getImportedRecordMaps(conversionContext),
    conversionContext,
    pageCreator: lensCreator,
    liveRevision: lensLiveRevision,
    resolverContext,
    lensMultiDocumentId: lensObj._id,
  });
}

export const wrappedImportSingleLens = async (mysqlConnectionString: string, options: ArbitalImportOptions, lensId: string) => {
  const optionsWithDefaults: ArbitalImportOptions = {...defaultArbitalImportOptions, ...options};
  const resolverContext = createAdminContext();
  const arbitalDb = await connectAndLoadArbitalDatabase(mysqlConnectionString);
  const conversionContext = await buildConversionContext(arbitalDb, [], optionsWithDefaults);
  
  const lens = arbitalDb.lenses.find(l => l.lensId === lensId);
  if (!lens) throw new Error(`Could not find lens: ${lensId}`);
  const parentTag = await Tags.findOne({"legacyData.arbitalPageId": lens.pageId});
  if (!parentTag) throw new Error(`Could not find tag for arbital page ${lens.pageId}`);
  const parentTagId = parentTag._id;
  const lensCreator = conversionContext.matchedUsers[lens.createdBy] ?? conversionContext.defaultUser;
  
  console.log(`Will add lens ${lens.id} (${lens.lensName}) to wiki page ${parentTag.name}, created by ${lensCreator.displayName}`);
  /*await importSingleLens({
    conversionContext,
    lens,
    parentTagId,
    resolverContext,
    lensCreator,
  });*/
}

export async function updateDenormalizedTagDescriptions() {
  const tags = await Tags.find({ 'legacyData.arbitalPageId': { $exists: true } }).fetch();
  await executePromiseQueue(tags.map(tag => async () => {
    const denormalizedRevision = await Revisions.findOne({ _id: tag.description_latest });
    if (!denormalizedRevision) {
      console.warn(`Could not find denormalized revision for tag ${tag.name} (${tag.slug})`);
    }
    const latestRevision = await Revisions.findOne({ documentId: tag._id, collectionName: 'Tags', fieldName: 'description' }, { sort: { editedAt: -1 } });
    if (!latestRevision) {
      console.warn(`Could not find latest revision for tag ${tag.name} (${tag.slug})`);
    }

    const useRevision = denormalizedRevision ?? latestRevision;
    if (!useRevision) {
      console.warn(`No revisions found for tag ${tag.name} (${tag.slug})`);
      return;
    }

    if (useRevision.html !== tag.description?.html) {
      console.log(`Html mismatch for tag ${tag.name} (${tag.slug}, id ${tag._id}) and revision ${useRevision._id} (${denormalizedRevision ? 'denormalized' : 'latest'})`);
    }

    if (useRevision.originalContents?.data !== tag.description?.originalContents?.data) {
      console.log(`Original contents data mismatch for tag ${tag.name} (${tag.slug}, id ${tag._id}) and revision ${useRevision._id} (${denormalizedRevision ? 'denormalized' : 'latest'})`);
    }
  }), 5);
}


interface CorrectedLens {
  tag_id: string;
  tag_name: string;
  tag_slug: string;
  tag_old_slugs: string[];
  lens_id: string;
  lens_slug: string;
  lens_old_slugs: string[];
  lens_contents_latest: string;
  revision_collection_name: string;
  latest_lens_revision_id: string;
}

export const reassignContentsLatestToMultiDocuments = async () => {
  const db = getSqlClientOrThrow();
  const rows = await db.any<CorrectedLens>(`
    SELECT
      t._id AS tag_id, t.name AS tag_name, t.slug AS tag_slug, t."oldSlugs" AS tag_old_slugs,
      md._id AS lens_id, md.slug AS lens_slug, md."oldSlugs" AS lens_old_slugs, md.contents_latest AS lens_contents_latest,
      r."collectionName" AS revision_collection_name,
      (SELECT _id FROM "Revisions" r2 WHERE r2."documentId" = md._id ORDER BY r2."editedAt" DESC LIMIT 1) AS latest_lens_revision_id
    FROM "MultiDocuments" md
    JOIN "Revisions" r
    ON md.contents_latest = r._id
    JOIN "Tags" t
    ON md."parentDocumentId" = t._id
    WHERE r."documentId" <> md._id;  
  `);

  console.log(`Found ${rows.length} rows`);
  for (const row of rows) {
    await MultiDocuments.rawUpdateOne(
      {_id: row.lens_id},
      {$set: {contents_latest: row.latest_lens_revision_id}}
    );
  }
};


export async function fixArbitalLensFirstRevisionUserId(mysqlConnectionString: string, options: ArbitalImportOptions) {
  const arbitalDb = await connectAndLoadArbitalDatabase(mysqlConnectionString);
  if (!options.userMatchingFile) {
    throw new Error("User matching file is required");
  }
  const matchedUsers = await loadUserMatching(options.userMatchingFile);

  const lenses = await MultiDocuments.find({
    "legacyData.arbitalLensId": { $exists: true },
    collectionName: "Tags",
    fieldName: "description",
  }).fetch();

  // Create array to store mismatches
  const mismatches: Array<{
    lensTitle: string | null,
    lensId: string,
    revisionId: string,
    revisionUserId: string | null,
    lensUserId: string,
    arbitalLensId: string,
    arbitalFirstRevisionUserId: string,
    matchedUserId: string,
  }> = [];

  for (const lens of lenses) {
    // get the first revision
    const initialRevision = await Revisions.findOne({
      documentId: lens._id,
      updateType: "initial",
    });

    if (!initialRevision) {
      console.log(`No initial revision found for lens ${lens._id}`);
      continue;
    }

    // find matching page to revision in Arbital DB
    const arbitalFirstRevision: PagesRow|undefined = arbitalDb.pages.find(p => p.pageId === lens.legacyData.arbitalLensId && p.edit === 1);
    if (!arbitalFirstRevision) {
      console.log(`No matching page found for revision ${initialRevision._id} in Arbital DB`);
      continue;
    }

    // find matching user in LessWrong DB
    const matchedUser = matchedUsers[arbitalFirstRevision.creatorId];
    if (!matchedUser) {
      console.log(`No matching user found for revision ${initialRevision._id} in LessWrong DB`);
      continue;
    }

    if (initialRevision.userId !== matchedUser._id) {
      const mismatch = {
        lensTitle: lens.title,
        lensId: lens._id,
        revisionId: initialRevision._id,
        revisionUserId: initialRevision.userId,
        lensUserId: lens.userId,
        arbitalLensId: lens.legacyData.arbitalLensId,
        arbitalFirstRevisionUserId: arbitalFirstRevision.creatorId,
        matchedUserId: matchedUser._id,
      };
      
      console.log("Correcting record for", mismatch);

      await Revisions.rawUpdateOne({
        _id: initialRevision._id,
      }, {
        $set: { userId: matchedUser._id },
      });

      await updateDenormalizedHtmlAttributions({
        document: lens,
        collectionName: "MultiDocuments",
        fieldName: "contents",
      });
      await updateDenormalizedContributorsList({
        document: lens,
        collectionName: "MultiDocuments",
        fieldName: "contents",
      });

      mismatches.push(mismatch);
    }
  }

  // Write mismatches to file
  if (mismatches.length > 0) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `arbital-lens-user-mismatches-prod-${timestamp}.json`;
    fs.writeFileSync(filename, JSON.stringify(mismatches, null, 2));
    console.log(`Wrote ${mismatches.length} mismatches to ${filename}`);
  } else {
    console.log("No mismatches found");
  }

}


