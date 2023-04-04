import { collectionIsSearchable } from "../../lib/make_searchable";
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
    // TODO TMP
    if (index.collectionName.toLowerCase() !== "posts") return null;
    const collection = getCollection(index.collectionName);
    if (!collection.isPostgres()) {
      throw new Error("Collection is not a PgCollection");
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

    // TMP: Renenable this later
    // if (!collectionIsSearchable(collectionName)) {
      // throw new Error("Collection is not searchable: " + collectionName);
    // }

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

  private async search<T extends DbObject = DbObject>(
    collection: PgCollection<T>,
    query: string,
    highlightPreTag: string,
    highlightPostTag: string,
    offset: number,
    limit: number,
    _sorting: Sorting, // TODO Sorting
  ) {
    const db = getSqlClientOrThrow();
    return db.any(`
      SELECT
        d."_id",
        d."userId",
        d."url",
        d."title",
        d."slug",
        d."baseScore",
        d."status",
        d."curatedDate" IS NOT NULL AS "curated",
        d."legacy",
        d."commentCount",
        d."userIP",
        d."createdAt",
        d."postedAt",
        d."postedAt" AS "publicDateMs",
        d."isFuture",
        d."isEvent",
        d."viewCount",
        d."lastCommentedAt",
        d."draft",
        d."af",
        ARRAY(SELECT JSONB_OBJECT_KEYS(d."tagRelevance")) AS "tags",
        u."slug" AS "authorSlug",
        u."displayName" AS "authorDisplayName",
        u."fullName" AS "authorFullName",
        r."nickname" AS "feedName",
        d."feedLink",
        d."_id" AS "objectID",
        TS_RANK_CD(
          d."searchVector",
          WEBSEARCH_TO_TSQUERY('english', $1), 1|32
        ) AS _rank,
        JSON_BUILD_OBJECT(
          'body', JSON_BUILD_OBJECT(
            'matchLevel', 'full',
            'value', TS_HEADLINE(
              'english',
              d."contents"->'html',
              WEBSEARCH_TO_TSQUERY('english', $1),
              'MinWords=20, MaxWords=30, StartSel=' || $2 || ', StopSel=' || $3
            )
          )
        ) AS "_snippetResult",
        JSON_BUILD_OBJECT(
          'title', JSON_BUILD_OBJECT(
            'matchLevel', 'full',
            'matchedWords', '{}'::TEXT[],
            'value', d."title"
          )
        ) AS "_highlightResult"
      FROM "${collection.table.getName()}" d
      JOIN "Users" u ON u."_id" = d."userId"
      JOIN "RSSFeeds" r ON r."_id" = d."feedId"
      WHERE
        WEBSEARCH_TO_TSQUERY('english', $1) @@ d."searchVector"
        AND d."status" = 2
        AND d."baseScore" >= 0
        AND d."deletedDraft" IS NOT TRUE
        AND d."draft" IS NOT TRUE
      ORDER BY _rank DESC
      OFFSET $4 LIMIT $5
    `, [query, highlightPreTag, highlightPostTag, offset, limit])
  }
}

export default PostgresSearchService;
