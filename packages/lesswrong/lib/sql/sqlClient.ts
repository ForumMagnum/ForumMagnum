import { isAnyTest } from "../executionEnvironment";

export const logAllQueries = false;
const SLOW_QUERY_REPORT_CUTOFF_MS = 2000;

let sql: SqlClient | null = null;
let sqlRead: SqlClient | null = null;

export const setSqlClient = (sql_: SqlClient, target: "read" | "write" = "write") => {
  if (target === "write") {
    sql = sql_;
  } else {
    sqlRead = sql_;
  }
}

export const getSqlClient = (target: "read" | "write" = "write") => {
  return target === "write" || !sqlRead ? sql : sqlRead;
}

export const getSqlClientOrThrow = (target: "read" | "write" = "write") => {
  if (target === "write" || !sqlRead) {
    if (!sql) {
      throw new Error("SQL Client is not initialized");
    }
    return sql;
  } else {
    if (!sqlRead) {
      throw new Error("SQL Client is not initialized");
    }
    return sqlRead;
  }
}

// TODO make this handle the read case, although I think this isn't required for actually running
// the server
export const closeSqlClient = async (client: SqlClient) => {
  if (client === sql) {
    sql = null;
  }
  await client.$pool.end();
}

export const runSqlQuery = async (query: string, args?: any, target: "read" | "write" = "write") => {
  const client = getSqlClientOrThrow(target);
  return await logIfSlow(
    () => client.any(query, args),
    () => `${query}: ${JSON.stringify(args)}`
  );
}

let queriesExecuted = 0;

export async function logIfSlow<T>(execute: ()=>Promise<T>, describe: string|(()=>string), quiet?: boolean) {
  function getDescription(): string {
    if (typeof describe==='string')
      return describe;
    else
      return describe();
  }
  
  let queryID: number = ++queriesExecuted;
  if (logAllQueries) {
    // eslint-disable-next-line no-console
    console.log(`Running Postgres query #${queryID}: ${getDescription()}`);
  }
  
  const startTime = new Date().getTime();
  const result = await execute()
  const endTime = new Date().getTime();

  const milliseconds = endTime - startTime;
  if (logAllQueries) {
    // eslint-disable-next-line no-console
    console.log(`Finished query #${queryID} (${milliseconds} ms)`);
  } else if (milliseconds > SLOW_QUERY_REPORT_CUTOFF_MS && !quiet && !isAnyTest) {
    // eslint-disable-next-line no-console
    console.trace(`Slow Postgres query detected (${milliseconds} ms): ${getDescription()}`);
  }

  return result;
}
