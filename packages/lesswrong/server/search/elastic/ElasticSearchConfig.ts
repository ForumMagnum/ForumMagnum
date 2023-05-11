import { AlgoliaIndexCollectionName } from "../../../lib/search/algoliaUtil";

export type Ranking = {
  field: string,
  order: "asc" | "desc",
  scoring: {
    type: "numeric",
    pivot: number,
  } | {
    type: "date",
  } | {
    type: "bool",
  },
}

export type IndexConfig = {
  fields: string[],
  snippet: string,
  highlight?: string,
  ranking?: Ranking[],
  tiebreaker: string,
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
      {field: "baseScore", order: "desc", scoring: {type: "numeric", pivot: 20}},
    ],
    tiebreaker: "publicDateMs",
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
      {field: "order", order: "asc", scoring: {type: "numeric", pivot: 2}},
      {field: "baseScore", order: "desc", scoring: {type: "numeric", pivot: 20}},
    ],
    tiebreaker: "publicDateMs",
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
      {field: "karma", order: "desc", scoring: {type: "numeric", pivot: 20}},
      {field: "createdAt", order: "desc", scoring: {type: "date"}},
    ],
    tiebreaker: "publicDateMs",
  },
  Sequences: {
    fields: [
      "title^3",
      "plaintextDescription",
      "authorDisplayName",
      "objectID",
    ],
    snippet: "plaintextDescription",
    tiebreaker: "publicDateMs",
  },
  Tags: {
    fields: [
      "name^3",
      "description",
      "objectID",
    ],
    snippet: "description",
    ranking: [
      {field: "core", order: "desc", scoring: {type: "bool"}},
      {field: "postCount", order: "desc", scoring: {type: "numeric", pivot: 10}},
    ],
    tiebreaker: "postCount",
  },
};
