import { isAnyTest } from "../executionEnvironment";

export const logAllQueries = false;
const SLOW_QUERY_REPORT_CUTOFF_MS = 2000;

let sql: SqlClient | null = null;

export const setSqlClient = (sql_: SqlClient) => sql = sql_;

export const getSqlClient = () => sql;

export const getSqlClientOrThrow = () => {
  if (!sql) {
    throw new Error("SQL Client is not initialized");
  }
  return sql;
}

export const closeSqlClient = async (client: SqlClient) => {
  if (client === sql) {
    sql = null;
  }
  await client.$pool.end();
}

export const runSqlQuery = async (query: string, args?: any) => {
  const client = getSqlClientOrThrow();
  return await logIfSlow(
    () => client.any(query, args),
    () => `${query}: ${JSON.stringify(args)}`
  );
}

let queriesExecuted = 0;

export async function logIfSlow<T>(execute: ()=>Promise<T>, describe: string|(()=>string), quiet?: boolean) {
  function getDescription(): string {
    const describeString = typeof describe==='string' ? describe : describe();
    // Truncate this at a pretty high limit, just to avoid logging things like entire rendered pages
    return describeString.slice(0, 5000);
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
    const description = getDescription();
    // eslint-disable-next-line no-console
    console.trace(`Slow Postgres query detected (${milliseconds} ms): ${description.substring(0,500)}`);
  }

  return result;
}
