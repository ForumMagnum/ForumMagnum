import type { Sql } from "postgres";
import { newDb, IMemoryDb } from "pg-mem";
import { Collections } from "../../vulcan-lib/getCollection";
import PgCollection from "../PgCollection";
import CreateTableQuery from "../CreateTableQuery";

const literal = (val: any) => {
  if (val === null) {
    return "NULL";
  }
  if (Array.isArray(val)) {
    return "(" + val.map(literal).join(", ") + ")";
  }
  if (typeof val === "number") {
    return val.toString();
  }
  val = val.toString();
  const prefix = ~val.indexOf("\\") ? "E" : "";
  return prefix + "'" + val.replace(/'/g, "''").replace(/\\/g, "\\\\") + "'";
}

const prepareValue = (val: any, seen?: any[]): any => {
  if (val === null || val === undefined) {
    return "NULL";
  }
  if (Buffer.isBuffer(val)) {
    return literal(val.toString("utf-8"));
  }
  if (val instanceof Date) {
    return literal(val.toISOString());
  }
  if (Array.isArray(val)) {
    return val.length === 0 ? `'{}'` : `ARRAY[${val.map(x => toLiteral(x)).join(", ")}]`;
  }
  if (typeof val === "object") {
    return prepareObject(val, seen);
  }
  return literal(val);
}

const prepareObject = (val: any, seen?: any[]) => {
  if (val && typeof val.toPostgres === "function") {
    seen = seen || [];
    if (seen.indexOf(val) !== -1) {
      throw new Error(`Circular reference detected while preparing ${val} for query`);
    }
    seen.push(val);
    return prepareValue(val.toPostgres(prepareValue), seen);
  }
  return literal(JSON.stringify(val));
}

const toLiteral = prepareValue;

const replaceQueryArgs = (sql: string, args: any[]) => {
  return sql.replace(/\$(\d+)/g, (str: any, istr: any) => {
    const i = Number.parseInt(istr);
    if (i > args.length) {
      throw new Error('Unmatched parameter in query ' + str);
    }
    const val = args[i - 1];
    return toLiteral(val);
  });
}

const initDb = (): IMemoryDb => {
  const db = newDb();
  for (const collection of Collections) {
    if (collection instanceof PgCollection) {
      if (!collection.table) {
        collection.buildPostgresTable();
      }
      const query = new CreateTableQuery(collection.table);
      const {sql, args} = query.compile();
      db.public.none(replaceQueryArgs(sql, args));
    }
  }
  return db;
}

export const createTestingSqlClient = () => {
  const db = initDb();
  const client = (sql: string, args: any[]) => {
    return db.public.many(replaceQueryArgs(sql, args));
  }
  client.unsafe = client;
  return client as unknown as Sql<any>;
}
