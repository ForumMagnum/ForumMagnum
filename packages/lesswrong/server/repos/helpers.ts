import { postStatuses } from "../../lib/collections/posts/constants";

/**
 * When changing this, also update the default view.
 */
export const getViewableSequencesSelector = (sequencesTableAlias?: string) => {
  const aliasPrefix = sequencesTableAlias ? `${sequencesTableAlias}.` : "";
  return `
    ${aliasPrefix}"hidden" = FALSE
  `;
}

const viewablePostFieldValues = {
  status: postStatuses.STATUS_APPROVED,
  draft: false,
  isFuture: false,
  unlisted: false,
  shortform: false,
  authorIsUnreviewed: false,
  hiddenRelatedQuestion: false,
  isEvent: false,
} as const;

/** Shared public-post filter for SQL queries and collection finds. */
export const viewablePostsSelector = {
  ...viewablePostFieldValues,
  postedAt: { $ne: null },
};

/** When changing this, also update the default view. */
export const getViewablePostsSelector = (
  postsTableAlias?: string,
  { includeShortform = false }: { includeShortform?: boolean } = {},
) => {
  const aliasPrefix = postsTableAlias ? `${postsTableAlias}.` : "";
  return Object.entries(viewablePostFieldValues)
    .filter(([field]) => !includeShortform || field !== "shortform")
    .map(([field, value]) => {
      const column = `${aliasPrefix}"${field}"`;
      return `${column} = ${typeof value === "boolean" ? String(value).toUpperCase() : value}`;
    }).concat(`${aliasPrefix}"postedAt" IS NOT NULL`).join(" AND\n    ");
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
