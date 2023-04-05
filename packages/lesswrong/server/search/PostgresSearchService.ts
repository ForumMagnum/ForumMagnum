import {
  collectionIsSearchable,
  getSearchableCollectionOptions,
} from "../../lib/make_searchable";
import PgCollection from "../../lib/sql/PgCollection";
import { getSqlClientOrThrow } from "../../lib/sql/sqlClient";
import { getCollection, isValidCollectionName } from "../vulcan-lib";
import type { PostgresSearchQuery } from "./PostgresSearchQuery";

type Sorting = "relevance" | "date" | "karma";

type Index = {
  prefix: string,
  collectionName: CollectionNameString,
  sorting: Sorting,
}

type ResultHit = DbObject

type Result = {
  hits: ResultHit[],
  nbHits: number,
  page: number,
  nbPages: number,
  hitsPerPage: number,
  exhaustiveNbHits: boolean,
  exhaustiveType: boolean,
  exhaustive: {
    nbHits: boolean,
    typo: boolean,
  },
  query: string,
  params: string,
  index: string,
  processingTimeMS: number,
  processingTimingsMS: {
    request: {
      roundTrip: number,
    },
  },
  serverTimeMS: number,
}

class PostgresSearchService {
  async runQuery({indexName, params}: PostgresSearchQuery): Promise<Result|null> {
    // TODO TMP
    if (indexName.toLowerCase().indexOf("posts") < 0) return null;

    const start = Date.now();
    const {
      query,
      highlightPreTag = "<b>",
      highlightPostTag = "</b>",
      hitsPerPage = 10,
      page = 0,
    } = params;
    const offset = page * hitsPerPage;
    const index = this.parseIndexName(indexName);
    const collection = getCollection(index.collectionName);
    if (!collectionIsSearchable(collection)) {
      throw new Error("Collection is not searchable");
    }
    const hits = await this.search(
      collection,
      query,
      highlightPreTag,
      highlightPostTag,
      offset,
      hitsPerPage,
      index.sorting,
    );
    const end = Date.now();
    const timeMS = end - start;
    return {
      hits,
      nbHits: hits.length, // TODO
      page,
      nbPages: 1, // TODO
      hitsPerPage,
      exhaustiveNbHits: true,
      exhaustiveType: true,
      exhaustive: {
        nbHits: true,
        typo: true,
      },
      query: query,
      params: this.urlEncode(params),
      index: indexName,
      processingTimeMS: timeMS,
      processingTimingsMS: {
        request: {
          roundTrip: timeMS,
        },
      },
      serverTimeMS: timeMS,
    };
  }

  private urlEncode(params: Record<string, unknown>): string {
    const data = Object.keys(params).map((key) => `${key}=${params[key]}`);
    return encodeURIComponent(data.join("&"));
  }

  private parseIndexName(indexName: string): Index {
    const tokens = indexName.split("_");
    if (tokens.length === 2) {
      tokens.push("");
    } else if (tokens.length !== 3) {
      throw new Error("Invalid index name: " + indexName);
    }

    const collectionName = tokens[1];
    if (!isValidCollectionName(collectionName)) {
      throw new Error("Invalid collection name: " + collectionName);
    }

    const index = {
      prefix: tokens[0],
      collectionName,
      sorting: this.chooseSorting(tokens[3]),
    };

    return index;
  }

  private chooseSorting(sorting: string): Sorting {
    switch (sorting) {
    case "date":
    case "karma":
        return sorting;
    default:
        return "relevance";
    }
  }

  private async search<T extends DbSearchableType = DbSearchableType>(
    collection: PgCollection<T>,
    query: string,
    highlightPreTag: string,
    highlightPostTag: string,
    offset: number,
    limit: number,
    _sorting: Sorting, // TODO Sorting
  ) {
    const {
      headlineTitleSelector: title,
      headlineBodySelector: body,
      filter,
      fields,
      syntheticFields = {},
      joins = [],
    } = getSearchableCollectionOptions(collection);
    const docName = "doc";
    const syntheticString = Object.keys(syntheticFields).map((field) =>
      `${syntheticFields[field](docName)} AS "${field}"`,
    ).join(", ");
    const joinSelects = joins.map(({docName: name, fields}) =>
      Object.keys(fields).map((field) =>
        `${name}."${field}" AS "${fields[field]}"`,
      ).join(", "),
    ).join(", ");
    const headlineBody = body
      ? `TS_HEADLINE(
          'english',
          ${docName}.${body},
          WEBSEARCH_TO_TSQUERY('english', $1),
          'MinWords=20, MaxWords=30, StartSel=' || $2 || ', StopSel=' || $3
        )`
      : "''";
    const sql = `SELECT
        ${fields.map((f) => `${docName}."${String(f)}"`).join(", ")}
        ${syntheticString ? ", " : ""} ${syntheticString}
        ${joinSelects ? ", " : ""} ${joinSelects} ,
        TS_RANK_CD(
          ${docName}."searchVector",
          WEBSEARCH_TO_TSQUERY('english', $1), 1|32
        ) AS _rank,
        JSON_BUILD_OBJECT(
          'title', JSON_BUILD_OBJECT(
            'matchLevel', 'full',
            'matchedWords', '{}'::TEXT[],
            'value', ${title ? `${docName}.${title}` : "''"}
          )
        ) AS "_highlightResult",
        JSON_BUILD_OBJECT(
          'body', JSON_BUILD_OBJECT(
            'matchLevel', 'full',
            'value', ${headlineBody}
          )
        ) AS "_snippetResult"
      FROM "${collection.table.getName()}" ${docName}
      ${joins.map(({join}) => "JOIN " + join(docName)).join("\n") ?? ""}
      WHERE WEBSEARCH_TO_TSQUERY('english', $1) @@ ${docName}."searchVector"
      ${filter ? `AND (${filter(docName)})` : ""}
      ORDER BY _rank DESC
      OFFSET $4 LIMIT $5
    `;
    return getSqlClientOrThrow().any(
      sql,
      [query, highlightPreTag, highlightPostTag, offset, limit],
    );
  }
}

export default PostgresSearchService;
