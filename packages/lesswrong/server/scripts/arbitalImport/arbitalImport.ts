import mysql from 'mysql2/promise';
import { Globals } from "@/lib/vulcan-lib/config";
import fs from 'node:fs';
import Users from '@/lib/collections/users/collection';
import UsersRepo from "../../repos/UsersRepo";
import { loadArbitalDatabase, WholeArbitalDatabase } from './arbitalSchema';
import keyBy from 'lodash/keyBy';
import groupBy from 'lodash/groupBy';
import { createAdminContext, createMutator, slugify } from '@/server/vulcan-lib';
import Tags from '@/lib/collections/tags/collection';
import { getUnusedSlugByCollectionName, slugIsUsed } from '@/lib/helpers';
import { randomId } from '@/lib/random';
import { arbitalMarkdownToHtml } from './arbitalMarkdown';
import { MultiDocuments } from '@/lib/collections/multiDocuments/collection';
import { executePromiseQueue } from '@/lib/utils/asyncUtils';
import path from 'path';


// Create the connection to database
Globals.importArbitalDb = async (mysqlConnectionString: string) => {
  let connection: mysql.Connection | null = null;
  try {
    console.log("Connecting to Arbital mysql database"); //eslint-disable-line no-console
    connection = await mysql.createConnection(mysqlConnectionString);
    const resolverContext = createAdminContext();

    console.log("Loading database into memory"); //eslint-disable-line no-console
    const wholeDatabase = await loadArbitalDatabase(connection);

    //console.log("Matching Arbital users to LW users"); //eslint-disable-line no-console
    // const matchedUsers = await matchArbitalUsers(wholeDatabase);
    // const matchedUsers = Object.fromEntries(wholeDatabase.users.map(u => [u.id,null]))
    const matchedUsers = await Users.findOne('nmk3nLpQE89dMRzzN').then(u => u ? { [u._id]: u } : {});
    
    console.log("Importing data into LW"); //eslint-disable-line no-console
    await doArbitalImport(wholeDatabase, matchedUsers, resolverContext);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the connection
    if (connection) {
      await connection.end();
    }
  }
}

Globals.deleteAllImportedArbitalData = async (mysqlConnectionString: string) => {
  await Tags.rawUpdateMany({
    "legacyData.arbitalPageId": {$exists: true},
    deleted: false,
  }, {
    "$set": {
      slug: `deleted-import-${randomId()}`,
      deleted: true,
    },
  });
}

Globals.replaceAllImportedArbitalData = async (mysqlConnectionString: string) => {
  await Globals.deleteAllImportedArbitalData(mysqlConnectionString);
  await Globals.importArbitalDb(mysqlConnectionString);
}

async function doArbitalImport(database: WholeArbitalDatabase, matchedUsers: Record<string,DbUser|null>, resolverContext: ResolverContext): Promise<void> {
  const pageInfosById = keyBy(database.pageInfos, pi=>pi.pageId);
  const pagesById = groupBy(database.pages, p=>p.pageId);
  const lensesByPageId = groupBy(database.lenses, l=>l.pageId);
  const wikiPageIds = database.pageInfos.filter(pi => pi.type === "wiki").map(pi=>pi.pageId);
  const pageIdsByTitle: Record<string,string> = {};
  const liveRevisionsByPageId: Record<string,WholeArbitalDatabase["pages"][0]> = {};
  // const defaultUser: DbUser|null = await Users.findOne({ username: "arbitalimport" });
  // if (!defaultUser) {
  //   throw new Error("There must be a user named arbitalimport to assign edits to");
  // }
  
  let slugsByPageId: Record<string,string> = {};
  const slugsCachePath = path.join(__dirname, "./slugsByPageId.json");
  if (fs.existsSync(slugsCachePath)) {
    slugsByPageId = JSON.parse(fs.readFileSync(slugsCachePath, "utf8"));
  }
  
  const pageImportFunctions = wikiPageIds
    .filter(pageId => pagesById[pageId]?.some(revision => revision.isLiveEdit))
    .map(pageId => {
      const revisions = pagesById[pageId] ?? [];
      const liveRevision = revisions.filter(r => r.isLiveEdit)[0];
      const title = liveRevision.title;
      
      return async () => {
        pageIdsByTitle[title] = pageId;
        liveRevisionsByPageId[pageId] = liveRevision;
        console.log(`${pageId}: ${title}`);
        slugsByPageId[pageId] = await getUnusedSlugByCollectionName("Tags", slugify(title));
      };
    });

  await executePromiseQueue(pageImportFunctions, 10);

  fs.writeFileSync(slugsCachePath, JSON.stringify(slugsByPageId, null, 2));
  
  console.log(`There are ${Object.keys(liveRevisionsByPageId).length} wiki pages with live revisions`);
  
  // const testPageTitles = ['Logical game', 'Big-O Notation'];
  const testPageTitles = ['Logical decision theories'];
  for (const title of testPageTitles) {
    const pageId = pageIdsByTitle[title];
    if (!pageId) {
      throw new Error(`No page with title: ${title}`);
    }
  // for (const pageId of Object.keys(liveRevisionsByPageId)) {
    try {
      const pageInfo = pageInfosById[pageId];
      if (pageInfo.isDeleted) continue;
      const lenses = lensesByPageId[pageId] ?? [];
      const liveRevision = liveRevisionsByPageId[pageId];
      const title = liveRevision.title;
      const pageCreator = matchedUsers[pageInfo.createdBy] // ?? defaultUser;
      const html = await arbitalMarkdownToHtml({database, markdown: liveRevision.text, slugsByPageId});
      const slug = await slugIsUsed("Tags", pageInfo.alias)
        ? await getUnusedSlugByCollectionName("Tags", slugify(title))
        : pageInfo.alias;
      console.log(`Creating wiki page: ${title} (${slug}).  Lenses found: ${lenses.map(l=>l.lensName).join(", ")}`);
      
      const { data: tag } = await createMutator({
        collection: Tags,
        document: {
          name: title,
          slug: slug,
          description: {
            originalContents: {
              type: "ckEditorMarkup",
              data: html,
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

      // Add lenses
      for (const lens of lenses) {
        const lensPageInfo = pageInfosById[lens.pageId];
        if (!lensPageInfo || lensPageInfo.isDeleted) {
          continue;
        }
        const lensLiveRevision = liveRevisionsByPageId[lens.pageId];
        const lensHtml = await arbitalMarkdownToHtml({database, markdown: lensLiveRevision.text, slugsByPageId});

        await createMutator({
          collection: MultiDocuments,
          document: {
            parentDocumentId: tag._id,
            collectionName: "Tags",
            fieldName: "description",
            title: lens.lensName,
            subtitle: lens.lensSubtitle,
            userId: pageCreator._id,
            index: lens.lensIndex,
            contents: {
              originalContents: {
                type: "ckEditorMarkup",
                data: lensHtml
              }
            },
          } as AnyBecauseHard,
          context: resolverContext,
          currentUser: pageCreator,
          validate: false,
        });
      }
    } catch(e) {
      console.error(e);
    }
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

async function matchArbitalUsers(database: WholeArbitalDatabase): Promise<Record<string,DbUser|null>> {
  const result: Record<string,DbUser|null> = {};
  const usersRepo = new UsersRepo();
  
  return Object.fromEntries(await Promise.all(
    database.users.map(arbitalUser =>
      [arbitalUser.id, usersRepo.getUserByEmail(arbitalUser.email)]
  )));
}

