import mysql from 'mysql2/promise';
import { Globals } from "@/lib/vulcan-lib/config";
import fs from 'node:fs';
import Users from '@/lib/collections/users/collection';
import UsersRepo from "../../repos/UsersRepo";
import { loadArbitalDatabase, WholeArbitalDatabase } from './arbitalSchema';
import keyBy from 'lodash/keyBy';
import groupBy from 'lodash/groupBy';
import { markdownToHtml } from '@/server/editor/conversionUtils';
import { createAdminContext, createMutator, slugify } from '@/server/vulcan-lib';
import Tags from '@/lib/collections/tags/collection';
import { getUnusedSlugByCollectionName } from '@/lib/helpers';



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
    //const matchedUsers = await matchArbitalUsers(wholeDatabase);
    const matchedUsers = Object.fromEntries(wholeDatabase.users.map(u => [u.id,null]))
    
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
  // TODO
}

async function doArbitalImport(database: WholeArbitalDatabase, matchedUsers: Record<string,DbUser|null>, resolverContext: ResolverContext): Promise<void> {
  const pageInfosById = keyBy(database.pageInfos, pi=>pi.pageId);
  const pagesById = groupBy(database.pages, p=>p.pageId);
  const lensesByPageId = groupBy(database.lenses, l=>l.pageId);
  const wikiPageIds = database.pageInfos.filter(pi => pi.type === "wiki").map(pi=>pi.pageId);
  const pageIdsByTitle: Record<string,string> = {};
  const liveRevisionsByPageId: Record<string,WholeArbitalDatabase["pages"][0]> = {};
  //const defaultUser: DbUser = await Users.findOne({ username: "arbitalimport" });
  
  for (const pageId of wikiPageIds) {
    const pageInfo = pageInfosById[pageId];
    const revisions = pagesById[pageId] ?? [];

    const liveRevision = revisions?.filter(r => r.isLiveEdit)?.[0];
    if (!liveRevision) {
      // TODO: Figure out what these pages are that have no live revision
      continue;
    }
    const title = liveRevision.title;
    pageIdsByTitle[title] = pageId
    liveRevisionsByPageId[pageId] = liveRevision;
    console.log(`${pageId}: ${title}`);
  }
  
  console.log(`There are ${Object.keys(liveRevisionsByPageId).length} wiki pages with live revisions`);
  
  const testPageTitles = ['Epistemology', 'Logical Uncertainty'];
  for (const title of testPageTitles) {
    const pageId = pageIdsByTitle[title];
    const pageInfo = pageInfosById[pageId];
    const lenses = lensesByPageId[pageId] ?? [];
    const liveRevision = liveRevisionsByPageId[pageId];
    /*const pageCreator = matchedUsers[pageInfo.createdBy] ?? defaultUser;
    const html = await arbitalMarkdownToHtml(database, liveRevision.text);
    
    await createMutator({
      collection: Tags,
      document: {
        user: pageCreator._id,
        name: title,
        slug: await getUnusedSlugByCollectionName("Tags", slugify(title)),
        description: {
          originalContents: {
            type: "markdown",
            value: liveRevision.text,
          },
        },
        legacyData: {
          "arbitalPageId": pageId,
        },
      },
      context: resolverContext,
      currentUser: pageCreator,
    });*/

    //console.log('==============');
    //console.log(`${title} (${lenses.length} lenses)`);
    //console.log(await arbitalMarkdownToHtml(database, liveRevision.text));
    //console.log('==============');
  }
}

async function arbitalMarkdownToHtml(database: WholeArbitalDatabase, markdown: string) {
  return await markdownToHtml(markdown);
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

