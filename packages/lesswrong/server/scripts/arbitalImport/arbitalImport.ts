/* eslint-disable no-console */

import mysql from 'mysql2/promise';
import { Globals } from "@/lib/vulcan-lib/config";
import fs from 'node:fs';
import Users from '@/lib/collections/users/collection';
import UsersRepo from "../../repos/UsersRepo";
import { loadArbitalDatabase, WholeArbitalDatabase, PageSummariesRow, PagesRow, PageInfosRow, DomainsRow } from './arbitalSchema';
import keyBy from 'lodash/keyBy';
import groupBy from 'lodash/groupBy';
import { createAdminContext, createMutator, slugify } from '@/server/vulcan-lib';
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
    await createMutator({
      collection: MultiDocuments,
      document: {
        parentDocumentId,
        collectionName,
        fieldName: "summary",
        title: summary.name,
        index: parseInt(idx),
        userId: pageCreator?._id,
        contents: {
          originalContents: {
            type: "ckEditorMarkup",
            data: summaryHtml,
          }
        },
      } as AnyBecauseHard,
      context: resolverContext,
      currentUser: pageCreator,
      validate: false,
    });
  }
}

export type ArbitalConversionContext = {
  database: WholeArbitalDatabase,
  matchedUsers: Record<string,DbUser|null>
  defaultUser: DbUser,
  slugsByPageId: Record<string,string>
  titlesByPageId: Record<string,string>
  pageInfosByPageId: Record<string, PageInfosRow>,
  domainsByPageId: Record<string, DomainsRow>,
}

async function doArbitalImport(database: WholeArbitalDatabase, resolverContext: ResolverContext, options: ArbitalImportOptions): Promise<void> {
  const pageInfosById = keyBy(database.pageInfos, pi=>pi.pageId);
  const pagesById = groupBy(database.pages, p=>p.pageId);
  const lensesByPageId = groupBy(database.lenses, l=>l.pageId);
  const domainsByPageId = keyBy(database.domains, d=>d.id);
  const summariesByPageId = groupBy(database.pageSummaries, s=>s.pageId);
  const wikiPageIds = database.pageInfos.filter(pi => pi.type === "wiki").map(pi=>pi.pageId);
  const pageIdsByTitle: Record<string,string> = {};
  const titlesByPageId: Record<string,string> = {};
  const liveRevisionsByPageId: Record<string,WholeArbitalDatabase["pages"][0]> = {};
  // const defaultUser: DbUser|null = await Users.findOne({ username: "arbitalimport" });
  // if (!defaultUser) {
  //   throw new Error("There must be a user named arbitalimport to assign edits to");
  // }
  
  let slugsByPageId: Record<string,string> = {};
  const slugsCachePath = path.join(__dirname, "./slugsByPageId.json");
  let cacheLoaded = false;
  if (fs.existsSync(slugsCachePath)) {
    slugsByPageId = JSON.parse(fs.readFileSync(slugsCachePath, "utf8"));
    cacheLoaded = true;
  }

  const defaultUser: DbUser|null = await Users.findOne({ username: "arbitalimport" });
  if (!defaultUser) {
    throw new Error("There must be a fallback user named arbitalimport to assign edits to");
  }

  //const matchedUsers: Record<string,DbUser|null> = { '2': await resolverContext.loaders.Users.load('nmk3nLpQE89dMRzzN') };
  const matchedUsers: Record<string,DbUser|null> = options.userMatchingFile
    ? await loadUserMatching(options.userMatchingFile)
    : {};

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
        console.log(`${pageId}: ${title}`);
        if (!cacheLoaded) {
          slugsByPageId[pageId] = await getUnusedSlugByCollectionName("Tags", slugify(title));
        }
      };
    }), 10
  );

  fs.writeFileSync(slugsCachePath, JSON.stringify(slugsByPageId, null, 2));
  
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
    : Object.keys(liveRevisionsByPageId)
  console.log(`Importing ${pageIdsToImport.length} pages`)
  
  const conversionContext: ArbitalConversionContext = {
    database,
    matchedUsers, defaultUser,
    slugsByPageId,
    titlesByPageId,
    pageInfosByPageId: pageInfosById,
    domainsByPageId,
  };
  
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
      const oldSlugs = [pageInfo.alias, ...pageAliasRedirects.map(ar => ar.oldAlias)];

      const oldestRevCkEditorMarkup = await arbitalMarkdownToCkEditorMarkup({
        markdown: revisions[0].text, pageId, conversionContext
      });
      console.log(`Creating wiki page: ${title} (${slug}).  Lenses found: ${lenses.map(l=>l.lensName).join(", ")}`);

      // Create wiki page with the oldest revision (we will create the rest of
      // revisions next; creating them in-order ensures some on-insert callbacks
      // work properly.)

      const { data: wiki } = await createMutator({
        collection: Tags,
        document: {
          name: title,
          slug: slug,
          oldSlugs,
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
      });
      /*await createSummariesForPage({
        pageId,
        importedRecordMaps,
        conversionContext,
        pageCreator,
        resolverContext,
        tagId: wiki._id,
      });*/

      // Back-date it to when it was created on Arbital
      await backDateObj(Tags, wiki._id, pageInfo.createdAt);

      // Fill in some metadata on the latest revision
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
      })

      // Add lenses
      if (lenses.length > 0) {
        console.log(`Importing ${lenses.length} lenses`);
      }
      for (const lens of lenses) {
        const lensPageInfo = pageInfosById[lens.pageId];
        if (!lensPageInfo || lensPageInfo.isDeleted) {
          continue;
        }

        const lensAliasRedirects = database.aliasRedirects.filter(ar => ar.newAlias === lensPageInfo.alias);
        const lensSlug = lensPageInfo.alias;
        const oldLensSlugs = lensAliasRedirects.map(ar => ar.oldAlias);
        const lensRevisions = database.pages.filter(p => p.pageId === lens.lensId);
        const lensFirstRevision = lensRevisions[0];
        const lensLiveRevision = liveRevisionsByPageId[lens.pageId];
        const lensTitle = lensLiveRevision.title;
        const lensFirstRevisionCkEditorMarkup = await arbitalMarkdownToCkEditorMarkup({
          markdown: lensFirstRevision.text,
          pageId: lens.pageId,
          conversionContext,
        });

        // Create the lens, with the oldest revision
        const { data: lensObj } = await createMutator({
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
          } as Partial<DbMultiDocument>,
          context: resolverContext,
          currentUser: pageCreator,
          validate: false,
        });
        await backDateObj(MultiDocuments, lensObj._id, lensFirstRevision.createdAt);
        
        await importRevisions({
          collection: MultiDocuments,
          fieldName: "contents",
          documentId: lensObj._id,
          pageId: lens.lensId,
          revisions: lensRevisions.slice(1),
          oldestRevCkEditorMarkup: lensFirstRevisionCkEditorMarkup,
          conversionContext: conversionContext,
        });

        /*await createSummariesForPage({
          pageId,
          importedRecordMaps,
          conversionContext,
          pageCreator,
          resolverContext,
          lensMultiDocumentId: lensObj._id,
        });*/
      }
    } catch(e) {
      console.error(e);
    }
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

async function importRevisions<N extends CollectionNameString>({
  collection, fieldName, documentId, pageId, revisions, oldestRevCkEditorMarkup, conversionContext
}: {
  collection: CollectionBase<N>,
  fieldName: string,
  documentId: string,
  pageId: string,
  revisions: PagesRow[],
  oldestRevCkEditorMarkup: string,
  conversionContext: ArbitalConversionContext,
}) {
  console.log(`Importing ${revisions.length} revisions of ${collection.collectionName}.${fieldName}:${pageId}`);
  const ckEditorMarkupByRevisionIndex = await asyncMapSequential(revisions,
    (rev) => arbitalMarkdownToCkEditorMarkup({
      markdown: rev.text, pageId,
      conversionContext,
    })
  );
  for (let i=0; i<revisions.length; i++) {
    const arbRevision = revisions[i];
    const ckEditorMarkup = await arbitalMarkdownToCkEditorMarkup({
      markdown: arbRevision.text,
      pageId,
      conversionContext
    });
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
        editedAt: arbRevision.createdAt,
        version: `1.${arbRevision.edit}.0`,
        changeMetrics: htmlToChangeMetrics(i>0 ? ckEditorMarkupByRevisionIndex[i-1] : oldestRevCkEditorMarkup, ckEditorMarkup),
        legacyData: {
          "arbitalPageId": pageId,
          "arbitalEditNumber": arbRevision.edit,
        },
      },
      currentUser: revisionCreator,
      validate: false,
    })).data;
    await afterCreateRevisionCallback.runCallbacksAsync([{ revisionID: lwRevision._id }]);
  }

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
