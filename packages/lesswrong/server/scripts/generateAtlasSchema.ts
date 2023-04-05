import CreateIndexQuery from "../../lib/sql/CreateIndexQuery";
import CreateTableQuery from "../../lib/sql/CreateTableQuery";
import PgCollection from "../../lib/sql/PgCollection";
import { getAllCollections, getCollection } from "../../lib/vulcan-lib/getCollection";
import { pgFormat } from "../sqlConnection";
import { createWriteStream } from "fs";
import { Globals } from "../vulcan-lib";

const getCreateTableQueryForCollection = <T extends DbObject = DbObject>(
  collection: PgCollection<T>,
): string => {
  const query = new CreateTableQuery(collection.table);
  const {sql, args} = query.compile();
  if (args.length) {
    throw new Error(`Unexpected arguments in create table query: ${args}`);
  }
  return sql + ";";
}

const getCreateIndexQueriesForCollection = <T extends DbObject = DbObject>(
  collection: PgCollection<T>,
): string[] => {
  const result: string[] = [];
  const rawIndexes = collection.table.getIndexes();
  for (const index of rawIndexes) {
    const query = new CreateIndexQuery(collection.table, index);
    let {sql, args} = query.compile();
    result.push(pgFormat(sql, args) + ";");
  }
  return result;
}

export const generateAtlasSchema = (filePath: string) => {
  const output = createWriteStream(filePath);
  const collectionNames = getAllCollections().map((c) => c.collectionName).sort();
  for (const collectionName of collectionNames) {
    const collection = getCollection(collectionName);
    if (!collection) {
      throw new Error(`Invalid collection: ${collectionName}`);
    }
    if (!collection.isPostgres()) {
      continue;
    }

    const table = getCreateTableQueryForCollection(collection);
    output.write(table);
    output.write("\n\n");

    const indexes = getCreateIndexQueriesForCollection(collection);
    for (const index of indexes) {
      output.write(index);
      output.write("\n\n");
    }
  }
}

Globals.generateAtlasSchema = generateAtlasSchema;
