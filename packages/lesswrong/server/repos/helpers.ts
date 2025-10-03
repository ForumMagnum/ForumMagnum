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

/**
 * When changing this, also update the default view.
 */
export const getViewablePostsSelector = (postsTableAlias?: string) => {
  const aliasPrefix = postsTableAlias ? `${postsTableAlias}.` : "";
  return `
    ${aliasPrefix}"status" = ${postStatuses.STATUS_APPROVED} AND
    ${aliasPrefix}"draft" = FALSE AND
    ${aliasPrefix}"deletedDraft" = FALSE AND
    ${aliasPrefix}"isFuture" = FALSE AND
    ${aliasPrefix}"unlisted" = FALSE AND
    ${aliasPrefix}"shortform" = FALSE AND
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
    ${aliasPrefix}"deletedDraft" IS FALSE AND
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
    ${aliasPrefix}"debateResponse" IS NOT TRUE AND
    ${aliasPrefix}"authorIsUnreviewed" IS NOT TRUE
  `;
};
