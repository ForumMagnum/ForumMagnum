import { Globals } from "../../lib/vulcan-lib/config";
import { getSqlClientOrThrow } from "@/server/sql/sqlClient"
import ElasticClient from "../search/elastic/ElasticClient";
import ElasticExporter from "../search/elastic/ElasticExporter";
import chunk from "lodash/chunk";

type DeletedUserDocument = {
  collectionName: "Posts" | "Comments" | "Sequences",
  documentId: string,
}

const reindexDeletedUserContent = async () => {
  const db = getSqlClientOrThrow();
  const docs = await db.any<DeletedUserDocument>(`
    SELECT 'Posts' "collectionName", p."_id" "documentId"
    FROM "Users" u
    JOIN "Posts" p ON u."_id" = p."userId"
    WHERE u."deleted" IS TRUE
    UNION
    SELECT 'Comments' "collectionName", c."_id" "documentId"
    FROM "Users" u
    JOIN "Comments" c ON u."_id" = c."userId"
    WHERE u."deleted" IS TRUE
    UNION
    SELECT 'Sequences' "collectionName", s."_id" "documentId"
    FROM "Users" u
    JOIN "Sequences" s ON u."_id" = s."userId"
    WHERE u."deleted" IS TRUE
  `);

  const client = new ElasticClient();
  const exporter = new ElasticExporter(client);

  const chunks = chunk(docs, 10);
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    // eslint-disable-next-line no-console
    console.log(`Reindexing chunk ${i} of ${chunks.length}...`);
    const promises = chunk.map(({collectionName, documentId}) => {
      return exporter.updateDocument(collectionName, documentId);
    });
    await Promise.all(promises);
  }
}

Globals.reindexDeletedUserContent = reindexDeletedUserContent;
