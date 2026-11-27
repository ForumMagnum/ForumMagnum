import { getSqlClient, replaceDbNameInPgConnectionString, setSqlClient } from "@/server/sql/sqlClient";
import { createSqlConnection } from "./sqlConnection";
import { sleep } from "@/lib/utils/asyncUtils";

const makeDbName = () => {
  const jestWorkerIdSuffix = process.env.JEST_WORKER_ID ? `_${process.env.JEST_WORKER_ID}` : "";
  const id = `${new Date().toISOString().replace(/[:.-]/g, "_")}_${process.pid}${jestWorkerIdSuffix}`;
  return `unittest_${id}`.toLowerCase();
}

const createTemporaryConnection = async () => {
  let client = getSqlClient();
  if (client) {
    return client;
  }
  const {PG_URL} = process.env;
  if (!PG_URL) {
    throw new Error("Can't initialize test DB - PG_URL not set");
  }
  client = await createSqlConnection(PG_URL, true);
  setSqlClient(client);
  return client;
}

export type TestingSqlClient = {
  sql: SqlClient,
  dbName: string,
}

export const createTestingSqlClientFromTemplate = async (template: string): Promise<TestingSqlClient> => {
  const {PG_URL} = process.env;
  if (!PG_URL) {
    throw new Error("Can't create testing SQL client from template - PG_URL not set");
  }
  if (!template) {
    throw new Error("No template database provided");
  }
  const dbName = makeDbName();
  let sql = await createTemporaryConnection();
  
  let retry = false;
  let retryCount = 0;
  do {
    try {
      retry = false;
      await sql.any('CREATE DATABASE "$1:value" TEMPLATE $2', [dbName, template]);
    } catch(e) {
      if (retryCount++ < 3 && /source database .* is being accessed by other users/.test(e.message)) {
        await sleep(1000);
        retry = true;
      } else {
        throw e;
      }
    }
  } while (retry);

  const testUrl = replaceDbNameInPgConnectionString(PG_URL, dbName);
  sql = await createSqlConnection(testUrl, true);
  process.env.PG_URL = testUrl;
  setSqlClient(sql);
  return {
    sql,
    dbName,
  };
}
