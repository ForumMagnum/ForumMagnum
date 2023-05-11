import type { MappingProperty } from "@elastic/elasticsearch/lib/api/types";
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

export type Mappings = Record<string, MappingProperty>;

export type IndexConfig = {
  fields: string[],
  snippet: string,
  highlight?: string,
  ranking?: Ranking[],
  tiebreaker: string,
  mappings?: Mappings,
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
    mappings: {
      authorSlug: {type: "keyword"},
      postGroupId: {type: "keyword"},
      postSlug: {type: "keyword"},
      tags: {type: "keyword"},
      userId: {type: "keyword"},
    },
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
      {field: "baseScore", order: "desc", scoring: {type: "numeric", pivot: 20}},
    ],
    tiebreaker: "publicDateMs",
    mappings: {
      authorSlug: {type: "keyword"},
      feedLink: {type: "keyword"},
      slug: {type: "keyword"},
      tags: {type: "keyword"},
      url: {type: "keyword"},
      userId: {type: "keyword"},
    },
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
    mappings: {
      careerStage: {type: "keyword"},
      groups: {type: "keyword"},
      slug: {type: "keyword"},
      website: {type: "keyword"},
      profileImageId: {type: "keyword"},
      profileTagIds: {type: "keyword"},
    },
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
    mappings: {
      userId: {type: "keyword"},
      authorSlug: {type: "keyword"},
      bannerImageId: {type: "keyword"},
    },
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
    mappings: {
      bannerImageId: {type: "keyword"},
      parentTagId: {type: "keyword"},
      slug: {type: "keyword"},
    },
  },
};
