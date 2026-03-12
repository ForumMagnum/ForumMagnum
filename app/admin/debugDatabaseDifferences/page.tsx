import React from "react";
import type { Metadata } from "next";
import merge from "lodash/merge";
import { cookies, headers } from "next/headers";
import { readFile } from "fs/promises";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import { getUser } from "@/server/vulcan-lib/apollo-server/getUserFromReq";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { getSqlClientOrThrow } from "@/server/sql/sqlClient";

import CopyDropIndexSqlButton from "./CopyDropIndexSqlButton";
import CollapsibleDiffSection from "./CollapsibleDiffSection";

assertRouteAttributes("/admin/debugDatabaseDifferences", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields("Debug Database Differences"), {
    robots: { index: true },
  });
}

type DbIndexRow = {
  schemaname: string;
  tablename: string;
  indexname: string;
  indexdef: string;
  idx_scan: number;
  idx_tup_read: number;
};

type DbTableRow = {
  table_name: string;
};

type DbColumnRow = {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: boolean;
};

type ExpectedColumn = {
  tableName: string;
  columnName: string;
  rawType: string;
  normalizedType: string;
  isNullable: boolean;
};

type CaseOnlyIndexMismatch = {
  unmentioned: DbIndexRow;
  mentioned: DbIndexRow;
};

type ColumnTypeMismatch = {
  tableName: string;
  columnName: string;
  expectedType: string;
  expectedNullable: boolean;
  actualType: string;
  actualNullable: boolean;
};

const getLoginTokenFromRequest = async (): Promise<string | null> => {
  const cookieStore = await cookies();
  const headerStore = await headers();
  return cookieStore.get("loginToken")?.value ?? headerStore.get("loginToken") ?? null;
};

const loadCurrentUser = async (): Promise<DbUser | null> => {
  const token = await getLoginTokenFromRequest();
  return await getUser(token);
};

const normalizeWhitespace = (value: string): string => value.trim().replace(/\s+/g, " ");

const normalizePgType = (value: string): string => {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/\btimestamp with time zone\b/g, "timestamptz")
    .replace(/\bcharacter varying\b/g, "varchar")
    .replace(/\bboolean\b/g, "bool")
    .replace(/\s*\(\s*/g, "(")
    .replace(/\s*\)\s*/g, ")")
    .replace(/\s*\[\s*\]/g, "[]")
    .replace(/\s+/g, " ");
};

const extractIndexNamesFromSql = (sql: string): Set<string> => {
  const names = new Set<string>();
  const createIndexRegex =
    /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:CONCURRENTLY\s+)?(?:IF\s+NOT\s+EXISTS\s+)?(?:"([^"]+)"|([A-Za-z0-9_]+))/gi;
  let match: RegExpExecArray | null;
  while ((match = createIndexRegex.exec(sql))) {
    const name = match[1] ?? match[2];
    if (name) {
      names.add(name);
    }
  }
  return names;
};

const parseExpectedColumnsFromSql = (sql: string): Map<string, Map<string, ExpectedColumn>> => {
  const tables = new Map<string, Map<string, ExpectedColumn>>();
  const createTableRegex = /CREATE TABLE "([^"]+)" \(([\s\S]*?)\);\n/g;
  let tableMatch: RegExpExecArray | null;

  while ((tableMatch = createTableRegex.exec(sql))) {
    const tableName = tableMatch[1];
    const tableBody = tableMatch[2];
    const columnMap = new Map<string, ExpectedColumn>();
    const lines = tableBody.split("\n");

    for (const rawLine of lines) {
      const line = rawLine.trim().replace(/,$/, "");
      if (!line) {
        continue;
      }

      const match = line.match(/^(?:"([^"]+)"|([A-Za-z_][A-Za-z0-9_]*))\s+(.+)$/);
      if (!match) {
        continue;
      }

      const columnName = match[1] ?? match[2];
      const definition = match[3];
      const constraintMatch = definition.search(
        /\s+(?:NOT\s+NULL|NULL|DEFAULT\b|PRIMARY\s+KEY|REFERENCES\b|CHECK\b|UNIQUE\b)/i,
      );
      const rawType = (constraintMatch === -1 ? definition : definition.slice(0, constraintMatch)).trim();
      const isNullable = !/\bNOT\s+NULL\b|\bPRIMARY\s+KEY\b/i.test(definition);

      columnMap.set(columnName, {
        tableName,
        columnName,
        rawType,
        normalizedType: normalizePgType(rawType),
        isNullable,
      });
    }

    tables.set(tableName, columnMap);
  }

  return tables;
};

const getKnownSchemaFromAcceptedSchema = async () => {
  const sql = await readFile("./schema/accepted_schema.sql", "utf8");
  return {
    indexNames: extractIndexNamesFromSql(sql),
    columnsByTable: parseExpectedColumnsFromSql(sql),
  };
};

const loadDbIndexes = async (): Promise<DbIndexRow[]> => {
  const sql = getSqlClientOrThrow("read");
  return await sql.any<DbIndexRow>(`
    SELECT
      i.schemaname,
      i.tablename,
      i.indexname,
      i.indexdef,
      COALESCE(s.idx_scan, 0)::bigint AS idx_scan,
      COALESCE(s.idx_tup_read, 0)::bigint AS idx_tup_read
    FROM
      pg_indexes i
      LEFT JOIN pg_stat_user_indexes s
        ON s.schemaname = i.schemaname
        AND s.relname = i.tablename
        AND s.indexrelname = i.indexname
    WHERE
      i.schemaname = 'public'
      AND i.tablename NOT LIKE 'pg_%'
      AND i.indexname NOT LIKE '%_pkey'
    ORDER BY
      i.schemaname,
      i.tablename,
      i.indexname
  `);
};

const loadDbTables = async (): Promise<string[]> => {
  const sql = getSqlClientOrThrow("read");
  const rows = await sql.any<DbTableRow>(`
    SELECT table_name
    FROM information_schema.tables
    WHERE
      table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  return rows.map((row) => row.table_name);
};

const loadDbColumns = async (): Promise<Map<string, Map<string, DbColumnRow>>> => {
  const sql = getSqlClientOrThrow("read");
  const rows = await sql.any<DbColumnRow>(`
    SELECT
      c.relname AS table_name,
      a.attname AS column_name,
      pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
      NOT a.attnotnull AS is_nullable
    FROM pg_catalog.pg_attribute a
    JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE
      n.nspname = 'public'
      AND c.relkind = 'r'
      AND a.attnum > 0
      AND NOT a.attisdropped
    ORDER BY c.relname, a.attnum
  `);

  const columnsByTable = new Map<string, Map<string, DbColumnRow>>();
  for (const row of rows) {
    const existingColumns = columnsByTable.get(row.table_name);
    if (existingColumns) {
      existingColumns.set(row.column_name, row);
    } else {
      columnsByTable.set(row.table_name, new Map([[row.column_name, row]]));
    }
  }
  return columnsByTable;
};

const normalizeCase = (value: string): string => value.toLowerCase();

const isIndexUsed = (index: Pick<DbIndexRow, "idx_scan" | "idx_tup_read">): boolean => {
  return index.idx_scan > 0 || index.idx_tup_read > 0;
};

const escapeSqlIdent = (identifier: string): string => identifier.replaceAll('"', '""');

const isCaseOnlyMismatch = (unmentioned: DbIndexRow, mentioned: DbIndexRow): boolean => {
  if (unmentioned.indexname === mentioned.indexname) {
    return false;
  }
  if (normalizeCase(unmentioned.indexname) !== normalizeCase(mentioned.indexname)) {
    return false;
  }
  return normalizeCase(unmentioned.indexdef) === normalizeCase(mentioned.indexdef);
};

export default async function Page() {
  const currentUser = await loadCurrentUser();
  if (!userIsAdmin(currentUser)) {
    return (
      <RouteRoot>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
          <p>Sorry, you do not have permission to do this at this time.</p>
        </div>
      </RouteRoot>
    );
  }

  const [dbIndexes, expectedSchema, dbTables, dbColumnsByTable] = await Promise.all([
    loadDbIndexes(),
    getKnownSchemaFromAcceptedSchema(),
    loadDbTables(),
    loadDbColumns(),
  ]);

  const expectedTableNames = new Set<string>(expectedSchema.columnsByTable.keys());
  const dbTableNames = new Set<string>(dbTables);
  const extraTables = [...dbTableNames].filter((tableName) => !expectedTableNames.has(tableName)).sort();
  const missingTables = [...expectedTableNames].filter((tableName) => !dbTableNames.has(tableName)).sort();
  const sharedTables = [...expectedTableNames].filter((tableName) => dbTableNames.has(tableName)).sort();

  const extraColumns: Array<{ tableName: string; columnName: string; actualType: string; actualNullable: boolean }> =
    [];
  const missingColumns: Array<{
    tableName: string;
    columnName: string;
    expectedType: string;
    expectedNullable: boolean;
  }> = [];
  const typeMismatches: ColumnTypeMismatch[] = [];

  for (const tableName of sharedTables) {
    const expectedColumns = expectedSchema.columnsByTable.get(tableName) ?? new Map<string, ExpectedColumn>();
    const dbColumns = dbColumnsByTable.get(tableName) ?? new Map<string, DbColumnRow>();

    for (const [columnName, dbColumn] of dbColumns.entries()) {
      const expectedColumn = expectedColumns.get(columnName);
      if (!expectedColumn) {
        extraColumns.push({
          tableName,
          columnName,
          actualType: dbColumn.data_type,
          actualNullable: dbColumn.is_nullable,
        });
        continue;
      }

      const normalizedActualType = normalizePgType(dbColumn.data_type);
      const isTypeMismatch = normalizedActualType !== expectedColumn.normalizedType;
      const isNullabilityMismatch = dbColumn.is_nullable !== expectedColumn.isNullable;
      if (isTypeMismatch || isNullabilityMismatch) {
        typeMismatches.push({
          tableName,
          columnName,
          expectedType: expectedColumn.rawType,
          expectedNullable: expectedColumn.isNullable,
          actualType: dbColumn.data_type,
          actualNullable: dbColumn.is_nullable,
        });
      }
    }

    for (const [columnName, expectedColumn] of expectedColumns.entries()) {
      if (!dbColumns.has(columnName)) {
        missingColumns.push({
          tableName,
          columnName,
          expectedType: expectedColumn.rawType,
          expectedNullable: expectedColumn.isNullable,
        });
      }
    }
  }

  extraColumns.sort((a, b) => (a.tableName === b.tableName ? a.columnName.localeCompare(b.columnName) : a.tableName.localeCompare(b.tableName)));
  missingColumns.sort((a, b) => (a.tableName === b.tableName ? a.columnName.localeCompare(b.columnName) : a.tableName.localeCompare(b.tableName)));
  typeMismatches.sort((a, b) => (a.tableName === b.tableName ? a.columnName.localeCompare(b.columnName) : a.tableName.localeCompare(b.tableName)));

  const extraIndexes = dbIndexes.filter((idx) => !expectedSchema.indexNames.has(idx.indexname));
  const unusedExtraIndexes = extraIndexes.filter((idx) => !isIndexUsed(idx));
  const dropUnusedIndexesSql = unusedExtraIndexes
    .map(
      (idx) =>
        `DROP INDEX CONCURRENTLY IF EXISTS "${escapeSqlIdent(idx.schemaname)}"."${escapeSqlIdent(idx.indexname)}";`,
    )
    .join("\n");
  const mentionedIndexesThatExist = dbIndexes.filter((idx) => expectedSchema.indexNames.has(idx.indexname));

  const mentionedByLowerName = new Map<string, DbIndexRow[]>();
  for (const idx of mentionedIndexesThatExist) {
    const key = normalizeCase(idx.indexname);
    const existing = mentionedByLowerName.get(key);
    if (existing) {
      existing.push(idx);
    } else {
      mentionedByLowerName.set(key, [idx]);
    }
  }

  const capitalizationMismatches: CaseOnlyIndexMismatch[] = [];
  const mismatchSeen = new Set<string>();
  for (const unmentioned of extraIndexes) {
    const candidates = mentionedByLowerName.get(normalizeCase(unmentioned.indexname)) ?? [];
    for (const mentioned of candidates) {
      if (!isCaseOnlyMismatch(unmentioned, mentioned)) {
        continue;
      }
      const key = `${unmentioned.schemaname}.${unmentioned.indexname}__${mentioned.schemaname}.${mentioned.indexname}`;
      if (mismatchSeen.has(key)) {
        continue;
      }
      mismatchSeen.add(key);
      capitalizationMismatches.push({ unmentioned, mentioned });
    }
  }

  const tableDifferenceCount = extraTables.length + missingTables.length;

  return (
    <RouteRoot>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
        <h1>Debug Database Differences</h1>
        <p>
          Comparing connected Postgres schema against <code>schema/accepted_schema.sql</code>.
        </p>

        <CollapsibleDiffSection title="Tables" numberOfItemsDifferent={tableDifferenceCount}>
          <p>
            Extra tables in DB: <b>{extraTables.length}</b> | Missing tables in DB: <b>{missingTables.length}</b>
          </p>
          {extraTables.length === 0 ? (
            <p>No extra tables found.</p>
          ) : (
            <div style={{ marginBottom: 12 }}>
              <b>Extra tables:</b>
              <ul>
                {extraTables.map((tableName) => (
                  <li key={`extra-table-${tableName}`}>
                    <code>{tableName}</code>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {missingTables.length === 0 ? (
            <p>No missing tables found.</p>
          ) : (
            <div style={{ marginBottom: 8 }}>
              <b>Missing tables:</b>
              <ul>
                {missingTables.map((tableName) => (
                  <li key={`missing-table-${tableName}`}>
                    <code>{tableName}</code>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CollapsibleDiffSection>

        <CollapsibleDiffSection title="Extra columns in DB" numberOfItemsDifferent={extraColumns.length}>
          {extraColumns.length === 0 ? (
            <p>None found.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 8 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px 6px" }}>Table</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px 6px" }}>Column</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px 6px" }}>Actual type</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px 6px" }}>Nullable?</th>
                </tr>
              </thead>
              <tbody>
                {extraColumns.map((column) => (
                  <tr key={`extra-column-${column.tableName}-${column.columnName}`}>
                    <td style={{ borderBottom: "1px solid #eee", padding: "8px 6px", whiteSpace: "nowrap" }}>
                      {column.tableName}
                    </td>
                    <td style={{ borderBottom: "1px solid #eee", padding: "8px 6px", whiteSpace: "nowrap" }}>
                      <code>{column.columnName}</code>
                    </td>
                    <td style={{ borderBottom: "1px solid #eee", padding: "8px 6px" }}>
                      <code>{column.actualType}</code>
                    </td>
                    <td style={{ borderBottom: "1px solid #eee", padding: "8px 6px" }}>
                      {column.actualNullable ? "Yes" : "No"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CollapsibleDiffSection>

        <CollapsibleDiffSection title="Missing columns in DB" numberOfItemsDifferent={missingColumns.length}>
          {missingColumns.length === 0 ? (
            <p>None found.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 8 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px 6px" }}>Table</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px 6px" }}>Column</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px 6px" }}>Expected type</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px 6px" }}>Nullable?</th>
                </tr>
              </thead>
              <tbody>
                {missingColumns.map((column) => (
                  <tr key={`missing-column-${column.tableName}-${column.columnName}`}>
                    <td style={{ borderBottom: "1px solid #eee", padding: "8px 6px", whiteSpace: "nowrap" }}>
                      {column.tableName}
                    </td>
                    <td style={{ borderBottom: "1px solid #eee", padding: "8px 6px", whiteSpace: "nowrap" }}>
                      <code>{column.columnName}</code>
                    </td>
                    <td style={{ borderBottom: "1px solid #eee", padding: "8px 6px" }}>
                      <code>{column.expectedType}</code>
                    </td>
                    <td style={{ borderBottom: "1px solid #eee", padding: "8px 6px" }}>
                      {column.expectedNullable ? "Yes" : "No"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CollapsibleDiffSection>

        <CollapsibleDiffSection
          title="Column type/nullability mismatches"
          numberOfItemsDifferent={typeMismatches.length}
        >
          {typeMismatches.length === 0 ? (
            <p>None found.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 8 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px 6px" }}>Table</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px 6px" }}>Column</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px 6px" }}>Expected type</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px 6px" }}>Actual type</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px 6px" }}>
                    Expected nullable?
                  </th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px 6px" }}>
                    Actual nullable?
                  </th>
                </tr>
              </thead>
              <tbody>
                {typeMismatches.map((mismatch) => (
                  <tr key={`mismatch-${mismatch.tableName}-${mismatch.columnName}`}>
                    <td style={{ borderBottom: "1px solid #eee", padding: "8px 6px", whiteSpace: "nowrap" }}>
                      {mismatch.tableName}
                    </td>
                    <td style={{ borderBottom: "1px solid #eee", padding: "8px 6px", whiteSpace: "nowrap" }}>
                      <code>{mismatch.columnName}</code>
                    </td>
                    <td style={{ borderBottom: "1px solid #eee", padding: "8px 6px" }}>
                      <code>{mismatch.expectedType}</code>
                    </td>
                    <td style={{ borderBottom: "1px solid #eee", padding: "8px 6px" }}>
                      <code>{mismatch.actualType}</code>
                    </td>
                    <td style={{ borderBottom: "1px solid #eee", padding: "8px 6px" }}>
                      {mismatch.expectedNullable ? "Yes" : "No"}
                    </td>
                    <td style={{ borderBottom: "1px solid #eee", padding: "8px 6px" }}>
                      {mismatch.actualNullable ? "Yes" : "No"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CollapsibleDiffSection>

        <CollapsibleDiffSection
          title="Indexes differing only by capitalization"
          numberOfItemsDifferent={capitalizationMismatches.length}
        >
          {capitalizationMismatches.length === 0 ? (
            <p>None found.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 8 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px 6px" }}>
                    Unmentioned index
                  </th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px 6px" }}>
                    Mentioned index
                  </th>
                </tr>
              </thead>
              <tbody>
                {capitalizationMismatches.map(({ unmentioned, mentioned }) => (
                  <tr key={`${unmentioned.schemaname}.${unmentioned.indexname}__${mentioned.schemaname}.${mentioned.indexname}`}>
                    <td style={{ borderBottom: "1px solid #eee", padding: "8px 6px", verticalAlign: "top" }}>
                      <div style={{ whiteSpace: "nowrap" }}>
                        <code>{unmentioned.indexname}</code> ({unmentioned.schemaname}.{unmentioned.tablename}) -{" "}
                        {isIndexUsed(unmentioned) ? "Used" : "Unused"} (idx_scan: {unmentioned.idx_scan}, idx_tup_read:{" "}
                        {unmentioned.idx_tup_read})
                      </div>
                      <code style={{ whiteSpace: "pre-wrap" }}>{unmentioned.indexdef}</code>
                    </td>
                    <td style={{ borderBottom: "1px solid #eee", padding: "8px 6px", verticalAlign: "top" }}>
                      <div style={{ whiteSpace: "nowrap" }}>
                        <code>{mentioned.indexname}</code> ({mentioned.schemaname}.{mentioned.tablename}) -{" "}
                        {isIndexUsed(mentioned) ? "Used" : "Unused"} (idx_scan: {mentioned.idx_scan}, idx_tup_read:{" "}
                        {mentioned.idx_tup_read})
                      </div>
                      <code style={{ whiteSpace: "pre-wrap" }}>{mentioned.indexdef}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CollapsibleDiffSection>

        <CollapsibleDiffSection
          title="Indexes not mentioned in schema file"
          numberOfItemsDifferent={extraIndexes.length}
          defaultExpanded
        >
          {extraIndexes.length === 0 && <p>None found.</p>}
          {extraIndexes.length > 0 && <>
            <p>
              Found <b>{extraIndexes.length}</b> unrecognized indexes (out of <b>{dbIndexes.length}</b> non-primary-key
              indexes).
            </p>

            <div style={{ marginBottom: 16, display: "flex", alignItems: "center", columnGap: 12, flexWrap: "wrap" }}>
              <CopyDropIndexSqlButton sql={dropUnusedIndexesSql} disabledText="No unused unmentioned indexes" />
              <span>
                Unused unmentioned indexes: <b>{unusedExtraIndexes.length}</b>
              </span>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 8 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px 6px" }}>Used?</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px 6px" }}>Schema</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px 6px" }}>Table</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px 6px" }}>Index</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px 6px" }}>idx_scan</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px 6px" }}>
                    idx_tup_read
                  </th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px 6px" }}>
                    Definition
                  </th>
                </tr>
              </thead>
              <tbody>
                {extraIndexes.map((idx) => (
                  <tr key={`${idx.schemaname}.${idx.indexname}`}>
                    <td style={{ borderBottom: "1px solid #eee", padding: "8px 6px", whiteSpace: "nowrap" }}>
                      {isIndexUsed(idx) ? "Used" : "Unused"}
                    </td>
                    <td style={{ borderBottom: "1px solid #eee", padding: "8px 6px", whiteSpace: "nowrap" }}>
                      {idx.schemaname}
                    </td>
                    <td style={{ borderBottom: "1px solid #eee", padding: "8px 6px", whiteSpace: "nowrap" }}>
                      {idx.tablename}
                    </td>
                    <td style={{ borderBottom: "1px solid #eee", padding: "8px 6px", whiteSpace: "nowrap" }}>
                      <code>{idx.indexname}</code>
                    </td>
                    <td style={{ borderBottom: "1px solid #eee", padding: "8px 6px", whiteSpace: "nowrap" }}>
                      {idx.idx_scan}
                    </td>
                    <td style={{ borderBottom: "1px solid #eee", padding: "8px 6px", whiteSpace: "nowrap" }}>
                      {idx.idx_tup_read}
                    </td>
                    <td style={{ borderBottom: "1px solid #eee", padding: "8px 6px" }}>
                      <code style={{ whiteSpace: "pre-wrap" }}>{idx.indexdef}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>}
        </CollapsibleDiffSection>
      </div>
    </RouteRoot>
  );
}
