import { postStatuses } from "../../lib/collections/posts/constants";

export const getViewableSequencesSelector = (sequencesTableAlias?: string) => {
  const aliasPrefix = sequencesTableAlias ? `${sequencesTableAlias}.` : "";
  return `
    ${aliasPrefix}"hidden" = FALSE
  `;
}

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

export const getViewableTagsSelector = (tagsTableAlias?: string) => {
  const aliasPrefix = tagsTableAlias ? `${tagsTableAlias}.` : "";
  return `
    ${aliasPrefix}"deleted" = FALSE
    ${aliasPrefix}"adminOnly" = FALSE
  `;
}
