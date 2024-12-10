/* eslint-disable no-console */

import mysql from 'mysql2/promise';
import { Globals } from "@/lib/vulcan-lib/config";
import fs from 'node:fs';
import Users from '@/lib/collections/users/collection';
import UsersRepo from "../../repos/UsersRepo";
import { loadArbitalDatabase, WholeArbitalDatabase, PageSummariesRow, PagesRow, PageInfosRow, DomainsRow, LensesRow } from './arbitalSchema';
import keyBy from 'lodash/keyBy';
import groupBy from 'lodash/groupBy';
import { createAdminContext, createMutator, slugify, updateMutator } from '@/server/vulcan-lib';
import Tags from '@/lib/collections/tags/collection';
import { getUnusedSlugByCollectionName, slugIsUsed } from '@/lib/helpers';
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
import { runSqlQuery } from '@/server/sql/sqlClient';
import { Comments } from '@/lib/collections/comments';
import uniq from 'lodash/uniq';
import maxBy from 'lodash/maxBy';

type ArbitalImportOptions = {
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
}
const defaultArbitalImportOptions: ArbitalImportOptions = {};

async function connectAndLoadArbitalDatabase(mysqlConnectionString: string): Promise<WholeArbitalDatabase> {
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
Globals.importArbitalDb = async (mysqlConnectionString: string, options?: Partial<ArbitalImportOptions>) => {
  const optionsWithDefaults: ArbitalImportOptions = {...defaultArbitalImportOptions, ...options};
  const wholeDatabase = await connectAndLoadArbitalDatabase(mysqlConnectionString);
  const resolverContext = createAdminContext();

  console.log("Importing data into LW"); //eslint-disable-line no-console
  await doArbitalImport(wholeDatabase, resolverContext, optionsWithDefaults);
}

Globals.deleteImportedArbitalWikiPages = async () => {
  const wikiPagesToDelete = await Tags.find({
    "legacyData.arbitalPageId": {$exists: true},
    deleted: false,
  }).fetch();
  for (const wikiPage of wikiPagesToDelete) {
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

Globals.deleteImportedArbitalUsers = async () => {
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

Globals.replaceAllImportedArbitalData = async (mysqlConnectionString: string, options?: ArbitalImportOptions) => {
  console.log(`Removing previously-imported wiki pages`);
  await Globals.deleteImportedArbitalWikiPages();
  console.log(`Importing Arbital content`);
  await Globals.importArbitalDb(mysqlConnectionString, options);
}

function summaryNameToSortOrder(name: string): number {
  if (name === 'Brief') return 0;
  if (name === 'Summary') return 1;
  if (name === 'Technical') return 2;
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
  resolverContext: ResolverContext;
  conversionContext: ArbitalConversionContext;
} & ({
  tagId: string;
} | {
  lensMultiDocumentId: string;
})

async function createSummariesForPage({ pageId, importedRecordMaps, pageCreator, conversionContext, resolverContext, ...parentIdArg }: CreateSummariesForPageArgs) {
  const { summariesByPageId } = importedRecordMaps;
  const topLevelPageSummaries = summariesByPageId[pageId] ?? [];
  topLevelPageSummaries.sort((a, b) => summaryNameToSortOrder(a.name) - summaryNameToSortOrder(b.name));

  for (const [idx, summary] of Object.entries(topLevelPageSummaries)) {
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

    // TODO: add slugs when those fields are implemented for MultiDocuments
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
          arbitalPageId: summary.pageId,
        },
      } as AnyBecauseHard,
      context: resolverContext,
      currentUser: pageCreator,
      validate: false,
    })).data;
    // TODO: Import summaries history and back-date objects
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

export type ArbitalConversionContext = {
  database: WholeArbitalDatabase,
  matchedUsers: Record<string,DbUser|null>
  defaultUser: DbUser,
  slugsByPageId: Record<string,string>
  titlesByPageId: Record<string,string>
  pageIdsByTitle: Record<string,string>
  pageInfosByPageId: Record<string, PageInfosRow>,
  domainsByPageId: Record<string, DomainsRow>,
  imageUrlsCache: Record<string,string>,
  pagesToConvertToLenses: Array<{
    tagId: string
    arbitalPageId: string
  }>,
  liveRevisionsByPageId: Record<string,WholeArbitalDatabase["pages"][0]>,
}

async function doArbitalImport(database: WholeArbitalDatabase, resolverContext: ResolverContext, options: ArbitalImportOptions): Promise<void> {
  await importWikiPages(database, resolverContext, options);
  //await importComments(database, resolverContext, options);
}


async function findCollidingWikiPages(database: WholeArbitalDatabase): Promise<{
  existingPagesToMove: Array<{
    lwWikiPageSlug: string
    newSlug: string
  }>
  pagesToConvertToLenses: Array<{
    tagId: string
    arbitalPageId: string
  }>
}> {
  const existingPagesToMove: Array<{
    lwWikiPageSlug: string
    newSlug: string
  }> = [];
  const pagesToConvertToLenses: Array<{
    tagId: string
    arbitalPageId: string
  }> = [];

  const pagesById = groupBy(database.pages, p=>p.pageId);
  const wikiPageIds = database.pageInfos.filter(pi => pi.type === "wiki").map(pi=>pi.pageId);

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

Globals.findCollidingWikiPages = async (mysqlConnectionString: string) => {
  const arbitalDb = await connectAndLoadArbitalDatabase(mysqlConnectionString);
  const { existingPagesToMove, pagesToConvertToLenses } = await findCollidingWikiPages(arbitalDb);
  console.log(existingPagesToMove);
  console.log(pagesToConvertToLenses);
}

async function renameCollidingWikiPages(existingPagesToMove: Array<{
  lwWikiPageSlug: string
  newSlug: string
}>): Promise<void> {
  await executePromiseQueue(
    existingPagesToMove.map(({lwWikiPageSlug, newSlug}) => {
      return async () => {
        return Tags.rawUpdateOne(
          {slug: lwWikiPageSlug},
          {$set: {
            slug: newSlug
          }}
        );
      }
    }),
    10
  );
}

async function buildConversionContext(database: WholeArbitalDatabase, options: ArbitalImportOptions): Promise<ArbitalConversionContext> {
  const pagesById = groupBy(database.pages, p=>p.pageId);
  const pageInfosById = keyBy(database.pageInfos, pi=>pi.pageId);
  
  const { existingPagesToMove, pagesToConvertToLenses } = await findCollidingWikiPages(database);
  // await renameCollidingWikiPages(existingPagesToMove);

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
  /*const slugsCachePath = path.join(__dirname, "./slugsByPageId.json");
  let cacheLoaded = false;
  if (fs.existsSync(slugsCachePath)) {
    slugsByPageId = JSON.parse(fs.readFileSync(slugsCachePath, "utf8"));
    cacheLoaded = true;
  }*/

  await executePromiseQueue(wikiPageIds
    .filter(pageId => pagesById[pageId]?.some(revision => revision.isLiveEdit))
    .map(pageId => {
      const revisions = pagesById[pageId] ?? [];
      const liveRevision = revisions.filter(r => r.isLiveEdit)[0];
      const title = liveRevision.title;
      
      return async () => {
        pageIdsByTitle[title] = pageId;
        titlesByPageId[pageId] = title;
        liveRevisionsByPageId[pageId] = liveRevision;
        
        // We can assume the slug is available because of the earlier call to
        // renameCollidingWikiPages().
        slugsByPageId[pageId] = slugify(title);
        /*if (!cacheLoaded) {
          slugsByPageId[pageId] = await getUnusedSlugByCollectionName("Tags", slugify(title));
        }*/
      };
    }), 10
  );

  //fs.writeFileSync(slugsCachePath, JSON.stringify(slugsByPageId, null, 2));
  
  return {
    database,
    matchedUsers, defaultUser,
    slugsByPageId,
    titlesByPageId,
    pageIdsByTitle,
    pageInfosByPageId: pageInfosById,
    domainsByPageId,
    liveRevisionsByPageId,
    pagesToConvertToLenses,
    imageUrlsCache: {},
  };
  
}

async function importWikiPages(database: WholeArbitalDatabase, resolverContext: ResolverContext, options: ArbitalImportOptions): Promise<void> {
  const pagesById = groupBy(database.pages, p=>p.pageId);
  const lensesByPageId = groupBy(database.lenses, l=>l.pageId);
  const lensIds = new Set(database.lenses.map(l=>l.lensId));
  const summariesByPageId = groupBy(database.pageSummaries, s=>s.pageId);

  const conversionContext = await buildConversionContext(database, options);
  const {
    pageInfosByPageId: pageInfosById, slugsByPageId, titlesByPageId,
    pageIdsByTitle, domainsByPageId, matchedUsers, defaultUser, liveRevisionsByPageId,
    pagesToConvertToLenses,
  } = conversionContext;
  console.log(`There are ${Object.keys(liveRevisionsByPageId).length} wiki pages with live revisions`);
  
  const importedRecordMaps: ImportedRecordMaps = {
    pageInfosById,
    pagesById,
    lensesByPageId,
    domainsByPageId,
    summariesByPageId,
    slugsByPageId,
    titlesByPageId,
  };
  
  const pageIdsToImport = options.pages
    ? options.pages.map(p => {
        if (pageIdsByTitle[p]) return pageIdsByTitle[p];
        if (pagesById[p]) return p;
        throw new Error(`Page title not found: ${p}`)
      })
    : Object.keys(liveRevisionsByPageId).filter(pageId => !lensIds.has(pageId))
  console.log(`Importing ${pageIdsToImport.length} pages`)
  
  const alternativesByPageId = computePageAlternatives(database);
  
  for (const pageId of pageIdsToImport) {
    try {
      const pageInfo = pageInfosById[pageId];
      if (pageInfo.isDeleted) continue;
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

      // Create wiki page with the oldest revision (we will create the rest of
      // revisions next; creating them in-order ensures some on-insert callbacks
      // work properly.)
      let wiki: DbTag|null;
      if (options.skipImportingPages) {
        wiki = await Tags.findOne({ 'legacyData.arbitalPageId': pageId });
        if (!wiki) {
          console.log(`Wiki page not found: ${pageId}`);
          continue;
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
        const lensPageInfo = pageInfosById[lens.lensId];
        if (!lensPageInfo || lensPageInfo.isDeleted) {
          continue;
        }

        const lensAliasRedirects = database.aliasRedirects.filter(ar => ar.newAlias === lensPageInfo.alias);
        const lensSlug = lensPageInfo.alias;
        // TODO: add lensId(?) to oldSlugs.  (Not sure if it's lensId or pageId)
        const lensRevisions = database.pages.filter(p => p.pageId === lens.lensId);
        const lensFirstRevision = lensRevisions[0];
        const lensLiveRevision = liveRevisionsByPageId[lens.lensId];
        const oldLensSlugs = [...lensAliasRedirects.map(ar => ar.oldAlias), lens.lensId];
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
              parentDocumentId: wiki._id,
              collectionName: "Tags",
              fieldName: "description",
              title: lensTitle,
              slug: lensSlug,
              oldSlugs: oldLensSlugs,
              //FIXME: preview/clickbait, tab-title, and subtitle need edit history/etc
              preview: lensLiveRevision.clickbait,
              tabTitle: lens.lensName,
              tabSubtitle: lens.lensSubtitle,
              userId: pageCreator?._id,
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
            currentUser: pageCreator,
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

        } else {
          lensObj = await MultiDocuments.findOne({ slug: lensSlug });
          if (!lensObj) {
            console.log(`Lens not found: ${lensSlug}`);
            continue;
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
          pageId,
          importedRecordMaps,
          conversionContext,
          pageCreator,
          resolverContext,
          lensMultiDocumentId: lensObj._id,
        });
      }
      
      const lwWikiPageToConvertToLens = pagesToConvertToLenses.find(({arbitalPageId}) => arbitalPageId === pageId);
      if (lwWikiPageToConvertToLens) {
        console.log(`Converting LW wiki page ${lwWikiPageToConvertToLens.tagId} to a lens`);
        const lwWikiPage = await Tags.findOne({_id: lwWikiPageToConvertToLens.tagId});
        if (!lwWikiPage) continue;
        const lwWikiPageCreator: DbUser = (await Users.findOne({_id: lwWikiPage.userId}))!;
        const lwWikiLensSlug = await getUnusedSlugByCollectionName("MultiDocuments", `lwwiki-${slugify(title)}`);
        const lwWikiLensIndex = lenses.length > 0
          ? maxBy(lenses, l => l.lensIndex)!.lensIndex + 1
          : 0;

        const lwWikiPageRevisions = await Revisions.find({
          documentId: lwWikiPage._id,
          fieldName: "description",
          collectionName: "Tags",
        }).fetch();
        if (!lwWikiPageRevisions.length) {
          continue;
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
  }
}

async function importComments(database: WholeArbitalDatabase, resolverContext: ResolverContext, options: ArbitalImportOptions): Promise<void> {
  const commentPageInfos = database.pageInfos.filter(pi => pi.type === "comment");
  const pageInfosById = keyBy(database.pageInfos, pi=>pi.pageId);
  let irregularComments: {reason: string, commentId: string}[] = [];
  const conversionContext = await buildConversionContext(database, options);

  let importedCommentCount = 0;
  const commentIdsToImport: string[] = [];
  let lwCommentsById: Record<string,DbComment> = {};
  
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
    const wikiPageParentId = parentIds.find(parentId => pageInfosById[parentId]?.type === "wiki")
    const parentCommentId = parentIds.find(parentId => pageInfosById[parentId]?.type === "comment")
    if (!wikiPageParentId) {
      irregularComments.push({reason: "Not a reply to a wiki page", commentId});
      continue;
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
    await Comments.rawUpdateOne({_id: lwComment._id}, {
      $set: {
        createdAt: comment.createdAt,
        postedAt: comment.createdAt,
      }
    });
  }
  

  // Insert the comments

  console.log(`Import found ${commentIdsToImport.length} normal comments and ${irregularComments.length} irregular comments`);
  const irregularCommentsByReason = groupBy(irregularComments, c=>c.reason)
  console.log(Object.keys(irregularCommentsByReason)
    .map((reason) => `${irregularCommentsByReason[reason].length}: ${reason}`)
    .join("\n")
  );
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
    await afterCreateRevisionCallback.runCallbacksAsync([{ revisionID: lwRevision._id }]);
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
Globals.matchArbitalToLWAccounts = async (mysqlConnectionString: string, outputCsvFilename: string) => {
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
Globals.createImportAccounts = async (csvFilename: string) => {
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

Globals.domainStats = async (mysqlConnectionString: string) => {
  const arbitalDb = await connectAndLoadArbitalDatabase(mysqlConnectionString);
  const pageIdsToHide = arbitalDb.pageInfos.filter(pi => pi.seeDomainId !== 0);
  console.log(`${pageIdsToHide.length}/${arbitalDb.pageInfos.length} pages hidden based on domain`);
}

Globals.hideContentFromNonDefaultDomains = async (mysqlConnectionString: string) => {
  const arbitalDb = await connectAndLoadArbitalDatabase(mysqlConnectionString);
  
  const pageIdsToDelete = arbitalDb.pageInfos.filter(pi => pi.seeDomainId !== 0).map(pi => pi.pageId);
  console.log(`Will delete ${pageIdsToDelete.length} pages`);
  
  const result = await Tags.rawUpdateMany({
    "legacyData.arbitalPageId": {$in: pageIdsToDelete}
  }, {
    $set: {deleted: true},
  });
}

async function cleanUpAccidentalLensTags(wholeArbitalDb: WholeArbitalDatabase) {
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

Globals.cleanUpAccidentalLensTags = async (mysqlConnectionString: string) => {
  const arbitalDb = await connectAndLoadArbitalDatabase(mysqlConnectionString);
  await cleanUpAccidentalLensTags(arbitalDb);
};

Globals.checkAccidentalLensTags = async (mysqlConnectionString: string) => {
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
Globals.updateLensIds = async (mysqlConnectionString: string) => {
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
