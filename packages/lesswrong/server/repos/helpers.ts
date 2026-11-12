import { postStatuses } from "../../lib/collections/posts/constants";
import { type ClassifiedTagFilters, filterModeToAdditiveKarmaModifier, filterModeToMultiplicativeKarmaModifier } from "@/lib/filterSettings";
import { getPgPromiseLib } from "@/server/sqlConnection";

/**
 * When changing this, also update the default view.
 */
export const getViewableSequencesSelector = (sequencesTableAlias?: string) => {
  const aliasPrefix = sequencesTableAlias ? `${sequencesTableAlias}.` : "";
  return `
    ${aliasPrefix}"hidden" = FALSE
  `;
}

/**
 * When changing this, also update the default view.
 */
export const getViewablePostsSelector = (
  postsTableAlias?: string,
  { includeShortform = false }: { includeShortform?: boolean } = {},
) => {
  const aliasPrefix = postsTableAlias ? `${postsTableAlias}.` : "";
  return `
    ${aliasPrefix}"status" = ${postStatuses.STATUS_APPROVED} AND
    ${aliasPrefix}"draft" = FALSE AND
    ${aliasPrefix}"isFuture" = FALSE AND
    ${aliasPrefix}"unlisted" = FALSE AND
    ${includeShortform ? "" : `${aliasPrefix}"shortform" = FALSE AND`}
    ${aliasPrefix}"authorIsUnreviewed" = FALSE AND
    ${aliasPrefix}"hiddenRelatedQuestion" = FALSE AND
    ${aliasPrefix}"isEvent" = FALSE AND
    ${aliasPrefix}"postedAt" IS NOT NULL
  `;
};

export const getViewableEventsSelector = (postsTableAlias?: string) => {
  const aliasPrefix = postsTableAlias ? `${postsTableAlias}.` : "";
  return `
    ${aliasPrefix}"isEvent" IS TRUE AND
    ${aliasPrefix}"status" = ${postStatuses.STATUS_APPROVED} AND
    ${aliasPrefix}"draft" IS FALSE AND
    ${aliasPrefix}"isFuture" IS FALSE AND
    ${aliasPrefix}"unlisted" IS FALSE AND
    ${aliasPrefix}"shortform" IS FALSE AND
    ${aliasPrefix}"rejected" IS NOT TRUE AND
    ${aliasPrefix}"authorIsUnreviewed" IS FALSE AND
    ${aliasPrefix}"hiddenRelatedQuestion" IS FALSE AND
    ${aliasPrefix}"postedAt" IS NOT NULL
  `;
};

/**
 * When changing this, also update the default view.
 */
export const getViewableTagsSelector = (tagsTableAlias?: string) => {
  const aliasPrefix = tagsTableAlias ? `${tagsTableAlias}.` : "";
  return `
    ${aliasPrefix}"deleted" = FALSE AND
    ${aliasPrefix}"adminOnly" = FALSE
  `;
}

export const getViewableCommentsSelector = (commentsTableAlias?: string) => {
  const aliasPrefix = commentsTableAlias ? `${commentsTableAlias}.` : "";
  return `
    ${aliasPrefix}"rejected" IS NOT TRUE AND
    ${aliasPrefix}"draft" IS NOT TRUE AND
    ${aliasPrefix}"debateResponse" IS NOT TRUE AND
    ${aliasPrefix}"authorIsUnreviewed" IS NOT TRUE
  `;
};

export const sqlValue = (value: string): string => {
  return `'${getPgPromiseLib().as.value(value)}'`;
}

const postHasTagSql = (tagId: string, postsTableAlias: string) =>
  `COALESCE((${postsTableAlias}."tagRelevance"->${sqlValue(tagId)})::INTEGER, 0) > 0`;

/**
 * When changing this, also update filterSettingsToParams in the posts views.
 */
export const getTagFilterSelector = (tagFilters: ClassifiedTagFilters, postsTableAlias: string): string => {
  const conditions = [
    ...tagFilters.required.map(tag => postHasTagSql(tag.tagId, postsTableAlias)),
    ...tagFilters.hidden.map(tag => `NOT (${postHasTagSql(tag.tagId, postsTableAlias)})`),
  ];
  return conditions.length > 0 ? `(${conditions.join(' AND ')})` : 'TRUE';
}

export const getTagFilterAdditiveKarmaSql = (tagFilters: ClassifiedTagFilters, postsTableAlias: string): string => {
  const terms = tagFilters.softFiltered.map(tag =>
    `(CASE WHEN ${postHasTagSql(tag.tagId, postsTableAlias)} THEN ${filterModeToAdditiveKarmaModifier(tag.filterMode)} ELSE 0 END)`
  );
  return terms.length > 0 ? `(${terms.join(' + ')})` : '0';
}

export const getTagFilterMultiplierSql = (tagFilters: ClassifiedTagFilters, postsTableAlias: string): string => {
  const factors = tagFilters.softFiltered.map(tag =>
    `(CASE WHEN ${postHasTagSql(tag.tagId, postsTableAlias)} THEN ${filterModeToMultiplicativeKarmaModifier(tag.filterMode)} ELSE 1 END)`
  );
  return factors.length > 0 ? `(${factors.join(' * ')})` : '1';
}
