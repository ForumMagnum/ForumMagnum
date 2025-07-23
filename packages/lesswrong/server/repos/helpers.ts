import { postStatuses } from "../../lib/collections/posts/constants";

/**
 * When changing this, also update the default view.
 */
export const getViewableSequencesSelector = (sequencesTableAlias?: string) => {
  const aliasPrefix = sequencesTableAlias ? `${sequencesTableAlias}.` : "";
  return `
    ${aliasPrefix}"hidden" IS NOT TRUE AND
    ${aliasPrefix}"draft" IS NOT TRUE
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
