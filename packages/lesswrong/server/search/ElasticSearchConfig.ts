import { AlgoliaIndexCollectionName } from "../../lib/search/algoliaUtil";

export type Ranking = {
  field: string,
  order: "asc" | "desc",
  expr?: string,
}

export type IndexConfig = {
  fields: string[],
  snippet: string,
  highlight?: string,
  ranking?: Ranking[],
}

export const elasticSearchConfig: Record<AlgoliaIndexCollectionName, IndexConfig> = {
  Comments: {
    fields: [
      "body",
      "authorDisplayName",
      "objectID",
    ],
    snippet: "body",
    highlight: "authorDisplayName",
    ranking: [
      {field: "baseScore", order: "desc"},
    ],
  },
  Posts: {
    fields: [
      "title^3",
      "authorDisplayName",
      "body",
      "objectID",
    ],
    snippet: "body",
    highlight: "title",
    ranking: [
      {field: "order", order: "asc", expr: "abcd"/*TODO*/},
      {field: "baseScore", order: "desc"},
      {field: "score", order: "desc"},
    ],
  },
  Users: {
    fields: [
      "displayName",
      "objectID",
      "bio",
      "mapLocationAddress",
      "jobTitle",
      "organization",
      "howICanHelpOthers",
      "howOthersCanHelpMe",
    ],
    snippet: "bio",
    ranking: [
      {field: "karma", order: "desc"},
      {field: "createdAt", order: "desc", expr: "abcd"/*TODO*/},
    ],
  },
  Sequences: {
    fields: [
      "title^3",
      "plaintextDescription",
      "authorDisplayName",
      "_id",
    ],
    snippet: "plaintextDescription",
  },
  Tags: {
    fields: [
      "name^3",
      "description",
      "objectID",
    ],
    snippet: "description",
    ranking: [
      {field: "core", order: "desc", expr: "abcd"/*TODO*/},
      {field: "postCount", order: "desc"},
    ],
  },
};
