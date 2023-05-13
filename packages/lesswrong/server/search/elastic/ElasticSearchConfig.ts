import type {
  MappingProperty,
  QueryDslQueryContainer,
} from "@elastic/elasticsearch/lib/api/types";
import { AlgoliaIndexCollectionName } from "../../../lib/search/algoliaUtil";
import { postStatuses } from "../../../lib/collections/posts/constants";

export type Ranking = {
  field: string,
  order: "asc" | "desc",
  weight?: number,
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
  filters?: QueryDslQueryContainer[],
  mappings?: Mappings,
}

const elasticSearchConfig: Record<AlgoliaIndexCollectionName, IndexConfig> = {
  Comments: {
    fields: [
      "body",
      "authorDisplayName",
      "objectID",
    ],
    snippet: "body",
    highlight: "authorDisplayName",
    ranking: [
      {
        field: "baseScore",
        order: "desc",
        weight: 0.5,
        scoring: {type: "numeric", pivot: 20},
      },
    ],
    tiebreaker: "publicDateMs",
    filters: [
      {term: {deleted: false}},
      {term: {rejected: false}},
      {term: {authorIsUnreviewed: false}},
      {term: {retracted: false}},
      {term: {spam: false}},
    ],
    mappings: {
      authorSlug: {type: "keyword"},
      postGroupId: {type: "keyword"},
      postSlug: {type: "keyword"},
      userId: {type: "keyword"},
      tags: {type: "keyword"},
      tagId: {type: "keyword"},
      tagSlug: {type: "keyword"},
      tagCommentType: {type: "keyword"},
    },
  },
  Posts: {
    fields: [
      "title^2",
      "authorDisplayName",
      "body",
      "objectID",
    ],
    snippet: "body",
    highlight: "title",
    ranking: [
      {
        field: "baseScore",
        order: "desc",
        weight: 8,
        scoring: {type: "numeric", pivot: 20},
      },
    ],
    tiebreaker: "publicDateMs",
    filters: [
      {term: {isFuture: false}},
      {term: {draft: false}},
      {term: {rejected: false}},
      {term: {authorIsUnreviewed: false}},
      {term: {status: postStatuses.STATUS_APPROVED}},
      {range: {baseScore: {gte: 0}}},
    ],
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
      {
        field: "karma",
        order: "desc",
        weight: 8,
        scoring: {type: "numeric", pivot: 20},
      },
      {
        field: "createdAt",
        order: "desc",
        scoring: {type: "date"},
      },
    ],
    tiebreaker: "publicDateMs",
    filters: [
      {range: {karma: {gte: 0}}},
      {term: {deleted: false}},
      {term: {deleteContent: false}},
    ],
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
    filters: [
      {term: {isDeleted: false}},
      {term: {draft: false}},
      {term: {hidden: false}},
    ],
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
      {
        field: "core",
        order: "desc",
        weight: 0.5,
        scoring: {type: "bool"},
      },
      {
        field: "postCount",
        order: "desc",
        weight: 0.25,
        scoring: {type: "numeric", pivot: 10},
      },
    ],
    tiebreaker: "postCount",
    filters: [
      {term: {deleted: false}},
      {term: {adminOnly: false}},
    ],
    mappings: {
      bannerImageId: {type: "keyword"},
      parentTagId: {type: "keyword"},
      slug: {type: "keyword"},
    },
  },
};

const indexToCollectionName = (index: string): AlgoliaIndexCollectionName => {
  const data: Record<string, AlgoliaIndexCollectionName> = {
    comments: "Comments",
    posts: "Posts",
    users: "Users",
    sequences: "Sequences",
    tags: "Tags",
  };
  if (!data[index]) {
    throw new Error("Invalid index name: " + index);
  }
  return data[index];
}

export const collectionNameToConfig = (
  collectionName: AlgoliaIndexCollectionName,
): IndexConfig => {
  const config = elasticSearchConfig[collectionName];
  if (!config) {
    throw new Error("Config not found for collection: " + collectionName);
  }
  return config;
}

export const indexNameToConfig = (indexName: string): IndexConfig => {
  const collectionName = indexToCollectionName(indexName);
  return collectionNameToConfig(collectionName);
}
