import type { Sql } from 'postgres';
import { newDb, IMemoryDb } from "pg-mem";

const literal = (val: any) => {
  if (val === null) {
    return 'NULL';
  }
  if (Array.isArray(val)) {
    return "(" + val.map(literal).join(", ") + ")"
  }
  const prefix = ~val.indexOf('\\') ? 'E' : '';
  return prefix + "'" + val.replace(/'/g, "''").replace(/\\/g, '\\\\') + "'";
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
    return val.length === 0 ? `'{}'` : `ARRAY[${val.map(x => toLiteral(x)).join(', ')}]`;
  }
  if (typeof val === 'object') {
    return prepareObject(val, seen);
  }
  return literal(val.toString());
}

const prepareObject = (val: any, seen?: any[]) => {
  if (val && typeof val.toPostgres === 'function') {
    seen = seen || []
    if (seen.indexOf(val) !== -1) {
      throw new Error('circular reference detected while preparing "' + val + '" for query')
    }
    seen.push(val)
    return prepareValue(val.toPostgres(prepareValue), seen)
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

export const createTestingSqlClient = () => {
  function client(this: {db?: IMemoryDb}, sql: string, args: any[]) {
    console.log("Executing", sql);
    if (!this.db) {
      this.db = newDb();
    }
    return this.db.public.many(replaceQueryArgs(sql, args));
  }
  return client as unknown as Sql<any>;
}
