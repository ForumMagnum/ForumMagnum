import { forumSelect } from "../../forumTypeUtils";
import { siteUrlSetting, taggingNameIsSet, taggingNamePluralSetting } from "../../instanceSettings";
import { combineUrls } from "../../vulcan-lib";
import { TagCommentType } from "../comments/types";
import Users from "../users/collection";

export const tagMinimumKarmaPermissions = forumSelect({
  // Topic spampocalypse defense
  EAForum: {
    new: 10,
    edit: 10,
  },
  // Default is to allow all users to create/edit tags
  default: {
    new: -1000,
    edit: -1000,
  }
})

type GetUrlOptions = {
  edit?: boolean,
  flagId?: string
}

export const tagUrlBase = taggingNameIsSet.get() ? taggingNamePluralSetting.get() : 'tag'
export const tagCreateUrl = `/${tagUrlBase}/create`
export const tagGradingSchemeUrl = `/${tagUrlBase}/tag-grading-scheme`

export const tagGetUrl = (tag: {slug: string}, urlOptions?: GetUrlOptions) => {
  const { flagId, edit } = urlOptions || {};
  const url = `/${tagUrlBase}/${tag.slug}`
  if (flagId && edit) return `${url}?flagId=${flagId}&edit=${edit}`
  if (flagId) return `${url}?flagId=${flagId}`
  if (edit) return `${url}?edit=${edit}`
  return url
}

export const tagGetHistoryUrl = (tag: {slug: string}) => `${tagGetUrl(tag)}/history`

export const tagGetDiscussionUrl = (tag: {slug: string}, isAbsolute=false) => {
  const suffix = `/${tagUrlBase}/${tag.slug}/discussion`
  return isAbsolute ? combineUrls(siteUrlSetting.get(), suffix) : suffix
}

export const tagGetSubforumUrl = (tag: {slug: string}, isAbsolute=false) => {
  const suffix = `/${tagUrlBase}/${tag.slug}/subforum`
  return isAbsolute ? combineUrls(siteUrlSetting.get(), suffix) : suffix
}

export const tagGetCommentLink = ({tagSlug, commentId, tagCommentType = "DISCUSSION", isAbsolute=false}: {
  tagSlug: string,
  commentId?: string,
  tagCommentType: TagCommentType,
  isAbsolute?: boolean,
}): string => {
  const base = tagCommentType === "DISCUSSION" ? tagGetDiscussionUrl({slug: tagSlug}, isAbsolute) : tagGetSubforumUrl({slug: tagSlug}, isAbsolute)
  return commentId ? `${base}#${commentId}` : base
}

export const tagGetRevisionLink = (tag: DbTag|TagBasicInfo, versionNumber: string): string => {
  return `/${tagUrlBase}/${tag.slug}?version=${versionNumber}`;
}

export const tagUserHasSufficientKarma = (user: UsersCurrent | DbUser | null, action: "new" | "edit"): boolean => {
  if (!user) return false
  if (user.isAdmin) return true
  if ((user.karma ?? 0) >= tagMinimumKarmaPermissions[action]) return true
  return false
}

export const subforumGetSubscribedUsers = async ({tagId}: {tagId: string}): Promise<DbUser[]> => {
  return await Users.find({profileTagIds: tagId}).fetch()
}
