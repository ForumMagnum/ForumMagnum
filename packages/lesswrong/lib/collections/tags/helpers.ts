import { taggingNameSetting } from "../../instanceSettings";

type GetUrlOptions = {
  edit?: boolean,
  flagId?: string
}

export const tagGetUrl = (tag: DbTag|TagBasicInfo|AlgoliaTag, urlOptions?: GetUrlOptions) => {
  const { flagId, edit } = urlOptions || {};
  const url = `/${taggingNameSetting}/${tag.slug}`
  if (flagId && edit) return `${url}?flagId=${flagId}&edit=${edit}`
  if (flagId) return `${url}?flagId=${flagId}`
  if (edit) return `${url}?edit=${edit}`
  return url
}

export const tagGetDiscussionUrl = (tag: DbTag|TagBasicInfo) => {
  return `/tag/${tag.slug}/discussion`
}

export const tagGetCommentLink = (tag: DbTag|TagBasicInfo, commentId: string): string => {
  return `/tag/${tag.slug}/discussion#${commentId}`
}

export const tagGetRevisionLink = (tag: DbTag|TagBasicInfo, versionNumber: string): string => {
  return `/tag/${tag.slug}?version=${versionNumber}`;
}
