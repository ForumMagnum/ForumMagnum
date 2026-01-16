import React from "react";
import type { Metadata } from "next";
import merge from "lodash/merge";
import { cookies, headers } from "next/headers";
import { readFile } from "fs/promises";

import RouteRoot from "@/components/layout/RouteRoot";
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import { getUser } from "@/server/vulcan-lib/apollo-server/getUserFromReq";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { getSqlClientOrThrow } from "@/server/sql/sqlClient";

import CopyDropIndexSqlButton from "./CopyDropIndexSqlButton";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields("Debug Database Indexes"), {
    robots: { index: false },
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

type CaseOnlyIndexMismatch = {
  unmentioned: DbIndexRow;
  mentioned: DbIndexRow;
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

const extractIndexNamesFromSql = (sql: string): Set<string> => {
  const names = new Set<string>();
  const createIndexRegex =
    /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:CONCURRENTLY\s+)?(?:IF\s+NOT\s+EXISTS\s+)?(?:"([^"]+)"|([A-Za-z0-9_]+))/gi;
  let match: RegExpExecArray | null;
  while ((match = createIndexRegex.exec(sql))) {
    const name = match[1] ?? match[2];
    if (name) names.add(name);
  }
  return names;
};

const getKnownIndexNamesFromAcceptedSchema = async (): Promise<Set<string>> => {
  const sql = await readFile("./schema/accepted_schema.sql", "utf8");
  return extractIndexNamesFromSql(sql);
};

const getKnownIndexNames = async (): Promise<Set<string>> => {
  return await getKnownIndexNamesFromAcceptedSchema();
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
      i.schemaname NOT IN ('pg_catalog', 'information_schema')
      AND i.tablename NOT LIKE 'pg_%'
      AND i.indexname NOT LIKE '%_pkey'
    ORDER BY
      i.schemaname,
      i.tablename,
      i.indexname
  `);
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

  const [dbIndexes, knownIndexNames] = await Promise.all([loadDbIndexes(), getKnownIndexNames()]);
  const extraIndexes = dbIndexes.filter((idx) => !knownIndexNames.has(idx.indexname));
  const unusedExtraIndexes = extraIndexes.filter((idx) => !isIndexUsed(idx));
  const dropUnusedIndexesSql = unusedExtraIndexes
    .map(
      (idx) =>
        `DROP INDEX CONCURRENTLY IF EXISTS "${escapeSqlIdent(idx.schemaname)}"."${escapeSqlIdent(idx.indexname)}";`,
    )
    .join("\n");
  const mentionedIndexesThatExist = dbIndexes.filter((idx) => knownIndexNames.has(idx.indexname));

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

  return (
    <RouteRoot>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
        <h1>Database indexes not mentioned in the codebase</h1>
        <p>
          Found <b>{extraIndexes.length}</b> unrecognized indexes (out of <b>{dbIndexes.length}</b> non-primary-key
          indexes).
        </p>

        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", columnGap: 12, flexWrap: "wrap" }}>
          <CopyDropIndexSqlButton
            sql={dropUnusedIndexesSql}
            disabledText="No unused unmentioned indexes"
          />
          <span>
            Unused unmentioned indexes: <b>{unusedExtraIndexes.length}</b>
          </span>
        </div>

        {capitalizationMismatches.length > 0 && <>
          <h2>Indexes that differ only by capitalization</h2>
          <p>
            Found <b>{capitalizationMismatches.length}</b> indexes where an unmentioned index appears to match an
            existing mentioned index, differing only by capitalization (name and definition).
          </p>
        </>}

        {capitalizationMismatches.length === 0 ? null : (
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
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
                      <code>{unmentioned.indexname}</code> ({unmentioned.schemaname}.{unmentioned.tablename}) —{" "}
                      {isIndexUsed(unmentioned) ? "Used" : "Unused"} (idx_scan: {unmentioned.idx_scan}, idx_tup_read:{" "}
                      {unmentioned.idx_tup_read})
                    </div>
                    <code style={{ whiteSpace: "pre-wrap" }}>{unmentioned.indexdef}</code>
                  </td>
                  <td style={{ borderBottom: "1px solid #eee", padding: "8px 6px", verticalAlign: "top" }}>
                    <div style={{ whiteSpace: "nowrap" }}>
                      <code>{mentioned.indexname}</code> ({mentioned.schemaname}.{mentioned.tablename}) —{" "}
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

        {extraIndexes.length === 0 ? (
          <p>None found.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
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
        )}
      </div>
    </RouteRoot>
  );
}

