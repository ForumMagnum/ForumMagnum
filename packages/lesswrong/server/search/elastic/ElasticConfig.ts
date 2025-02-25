import type {
  MappingProperty,
  QueryDslQueryContainer,
} from "@elastic/elasticsearch/lib/api/types";
import { SearchIndexCollectionName } from "../../../lib/search/searchUtil";
import { postStatuses } from "../../../lib/collections/posts/constants";
import { isEAForum } from "../../../lib/instanceSettings";
import { isFriendlyUI } from "@/themes/forumTheme";

export type Ranking = {
  field: string,
  order: "asc" | "desc",
  weight?: number,
  scoring: {
    type: "numeric",
    pivot: number,
    min?: number,
  } | {
    type: "date",
  } | {
    type: "bool",
  },
}

export type Mappings = Record<string, MappingProperty>;

export type IndexConfig = {
  /**
   * An array of field names that compared against the search query.
   * By default, this uses a fuzzy full text search. The first field listed will also
   * be checked for an exact match, otherwise order doesn't matter.
   * Field names may be appended with a relevance boost. For instance, "title^3", which
   * will make matches on that field 3 times more relevant than matches on other fields.
   * You never need to include objectID here as that is always checked separately.
   */
  fields: string[],
  /**
   * The name of the field to create a match snippet from.
   */
  snippet: string,
  /**
   * The name of the field to create a match highlight from.
   */
  highlight?: string,
  /**
   * An array of ranking specifications to manually tune the relevancy of results.
   * Ordering does not matter.
   */
  ranking?: Ranking[],
  /**
   * The name of the field to use as a tie-breaker in the event that multiple results
   * have exactly the same ranking (normally a date and ideally guaranteed to be
   * unique). Note that relevancy is calculated as a floating point number so the
   * probability of two results actually having the same relevancy is extremely low.
   */
  tiebreaker: string,
  /**
   * Filters to completely remove entries from the result set, irregardless of their
   * relevancy to the query. This is often used to remove deleted data.
   */
  filters?: QueryDslQueryContainer[],
  /**
   * Mappings define the schema of the table. In general, elasticsearch infers the
   * type of data when it is inserted so we do not need to keep a complete schema
   * here with all the fields listed (see the serach export queries in the repos for
   * the ultimate source of truth on what data is exported).
   * We only need to add a field here if we know that elastic will infer the wrong
   * type. Most notably, all strings are infered to be of type "text", which means
   * they get stemmed and analyzed - this is normally what we want but leads to bad
   * results when used on more structured strings like ids or slugs, which should
   * instead be given the "keyword" mapping.
   * Note that making a change here requires reindexing the data with
   * `elasticConfigureIndex`.
   */
  mappings?: Mappings,
  /**
   * An array of field names that should not be sent to the client. This may be
   * because the data is private, or just because it isn't needed and we want to
   * save on network traffic.
   */
  privateFields: string[],
  /**
   * The name of the field to sort on when sorting by karma. Defaults to
   * `baseScore` if not defined.
   */
  karmaField?: string,
  /**
   * Field used for location based geo-sorting
   */
  locationField?: string,
}

/**
 * Fields that use full-text search (ie; generally all of the fields that are
 * listed in the `field` array) should use this mapping. This allows us to use
 * our normal full text analyzer with stemming and synonyms for normal searches,
 * but to fall back to the exact analyzer which has no stemming for advanced
 * searches using quotes.
 */
const fullTextMapping: MappingProperty = {
  type: "text",
  analyzer: "fm_synonym_analyzer",
  fields: {
    exact: {
      type: "text",
      analyzer: "fm_exact_analyzer",
    },
    sort: {
      // A wildcard is similar to a keyword, but supports data larger than 32KB
      type: "wildcard",
      null_value: "",
    },
  },
};

/**
 * The shingle text mapping is particularly suited to short text fields that
 * often contain punctuation but not a lot of semantic meaning, such as
 * usernames.
 */
const shingleTextMapping: MappingProperty = {
  type: "text",
  analyzer: "fm_shingle_analyzer",
  fields: {
    exact: {
      type: "text",
      analyzer: "fm_exact_analyzer",
    },
    sort: {
      type: "keyword",
      normalizer: "fm_sortable_keyword",
    },
  },
};

const geopointMapping: MappingProperty = {
  type: "geo_point",
};

/**
 * Fields that should not be analyzed at all (ie; ids, slugs or enums) should
 * use a keyword mapping.
 */
const keywordMapping: MappingProperty = {
  type: "keyword",
};

const objectMapping = (
  properties: Record<string, MappingProperty>,
): MappingProperty => ({properties});

const elasticSearchConfig: Record<SearchIndexCollectionName, IndexConfig> = {
  Comments: {
    fields: [
      "body",
      "authorDisplayName^11",
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
      {
        field: "baseScore",
        order: "desc",
        weight: 1.5,
        scoring: {type: "numeric", pivot: 50, min: 50},
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
      body: fullTextMapping,
      postTitle: fullTextMapping,
      authorDisplayName: shingleTextMapping,
      authorUserName: shingleTextMapping,
      authorSlug: shingleTextMapping,
      postGroupId: keywordMapping,
      postSlug: keywordMapping,
      userId: keywordMapping,
      tags: keywordMapping,
      tagId: keywordMapping,
      tagSlug: keywordMapping,
      tagCommentType: keywordMapping,
    },
    privateFields: [
      "authorIsUnreviewed",
      "deleted",
      "legacy",
      "rejected",
      "retracted",
      "spam",
    ],
  },
  Posts: {
    fields: [
      "title^3",
      "authorDisplayName^4",
      "body",
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
      {term: {unlisted: false}},
      {term: {status: postStatuses.STATUS_APPROVED}},
      ...(isEAForum ? [] : [{range: {baseScore: {gte: 0}}}]),
    ],
    mappings: {
      title: fullTextMapping,
      authorDisplayName: shingleTextMapping,
      authorFullName: shingleTextMapping,
      authorSlug: shingleTextMapping,
      body: fullTextMapping,
      feedLink: keywordMapping,
      slug: keywordMapping,
      tags: objectMapping({
        _id: keywordMapping,
        slug: keywordMapping,
        name: keywordMapping,
      }),
      url: keywordMapping,
      userId: keywordMapping,
    },
    privateFields: [
      "authorIsUnreviewed",
      "unlisted",
      "draft",
      "isFuture",
      "legacy",
      "rejected",
      "status",
      "viewCount",
    ],
  },
  Users: {
    fields: [
      "displayName^10000",
      "bio",
      "mapLocationAddress",
      "jobTitle",
      "organization",
      "howICanHelpOthers",
      "howOthersCanHelpMe",
      ...(isFriendlyUI
        ? [
          "tags.name",
          "posts.title",
        ]
        : []),
    ],
    snippet: "bio",
    ranking: [
      {
        field: "karma",
        order: "desc",
        weight: 2,
        scoring: {type: "numeric", pivot: 5000, min: 1000},
      },
      {
        field: "karma",
        order: "desc",
        weight: 1.5,
        scoring: {type: "numeric", pivot: 1000, min: 1000},
      },
      {
        field: "karma",
        order: "desc",
        weight: 1,
        scoring: {type: "numeric", pivot: 100, min: 10},
      },
      {
        field: "createdAt",
        order: "desc",
        weight: 0.5,
        scoring: {type: "date"},
      },
    ],
    tiebreaker: "karma",
    filters: [
      {term: {deleted: false}},
      {term: {deleteContent: false}},
    ],
    mappings: {
      displayName: shingleTextMapping,
      bio: fullTextMapping,
      mapLocationAddress: fullTextMapping,
      jobTitle: fullTextMapping,
      organization: fullTextMapping,
      howICanHelpOthers: fullTextMapping,
      howOthersCanHelpMe: fullTextMapping,
      careerStage: keywordMapping,
      groups: keywordMapping,
      slug: shingleTextMapping,
      website: keywordMapping,
      profileImageId: keywordMapping,
      tags: objectMapping({
        _id: keywordMapping,
        slug: keywordMapping,
        name: keywordMapping,
      }),
      posts: objectMapping({
        _id: keywordMapping,
        slug: keywordMapping,
        title: fullTextMapping,
      }),
      _geoloc: geopointMapping,
    },
    privateFields: [
      "deleteContent",
      "deleted",
      "isAdmin",
      "hideFromPeopleDirectory",
    ],
    karmaField: "karma",
    locationField: "_geoloc",
  },
  Sequences: {
    fields: [
      "title^3",
      "plaintextDescription",
      "authorDisplayName",
    ],
    snippet: "plaintextDescription",
    tiebreaker: "publicDateMs",
    filters: [
      {term: {isDeleted: false}},
      {term: {draft: false}},
      {term: {hidden: false}},
    ],
    mappings: {
      body: fullTextMapping,
      plaintextDescription: fullTextMapping,
      authorDisplayName: shingleTextMapping,
      userId: keywordMapping,
      authorSlug: shingleTextMapping,
      bannerImageId: keywordMapping,
    },
    privateFields: [
      "draft",
      "hidden",
      "isDeleted",
    ],
  },
  Tags: {
    fields: [
      "name^30",
      "description",
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
        field: "baseScore",
        order: "desc",
        weight: 0.5,
        scoring: {type: "numeric", pivot: 20},
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
      {term: {isPlaceholderPage: false}},
      {term: {adminOnly: false}},
    ],
    mappings: {
      name: fullTextMapping,
      description: fullTextMapping,
      bannerImageId: keywordMapping,
      parentTagId: keywordMapping,
      slug: keywordMapping,
    },
    privateFields: [
      "deleted",
    ],
  },
};

export const indexToCollectionName = (index: string): SearchIndexCollectionName => {
  const data: Record<string, SearchIndexCollectionName> = {
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
  collectionName: SearchIndexCollectionName,
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

export const isFullTextField = <N extends SearchIndexCollectionName>(
  collectionName: N,
  fieldName: string,
) => {
  const config = elasticSearchConfig[collectionName];
  if (!config) {
    throw new Error(`Invalid elastic collection name: ${collectionName}`);
  }
  return config.mappings?.[fieldName] === fullTextMapping;
}
