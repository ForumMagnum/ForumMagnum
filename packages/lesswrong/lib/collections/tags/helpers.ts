import qs from "qs";
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
  tab?: string
}

export const tagUrlBase = taggingNameIsSet.get() ? taggingNamePluralSetting.get() : 'tag'
export const tagCreateUrl = `/${tagUrlBase}/create`
export const tagGradingSchemeUrl = `/${tagUrlBase}/tag-grading-scheme`

export const tagGetUrl = (tag: {slug: string}, urlOptions?: GetUrlOptions, isAbsolute=false, hash?: string) => {
  const urlSearchParams = urlOptions
  const search = qs.stringify(urlSearchParams)

  const searchSuffix = `${search ? `?${search}` : ''}`
  const hashSuffix = `${hash ? `#${hash}` : ''}`

  const url = `/${tagUrlBase}/${tag.slug}`
  const urlWithSuffixes = `${url}${searchSuffix}${hashSuffix}`
  return isAbsolute ? combineUrls(siteUrlSetting.get(), urlWithSuffixes) : urlWithSuffixes
}

export const tagGetHistoryUrl = (tag: {slug: string}) => `/${tagUrlBase}/${tag.slug}/history`

export const tagGetDiscussionUrl = (tag: {slug: string}, isAbsolute=false) => {
  const suffix = `/${tagUrlBase}/${tag.slug}/discussion`
  return isAbsolute ? combineUrls(siteUrlSetting.get(), suffix) : suffix
}

export const tagGetSubforumUrl = (tag: {slug: string}, isAbsolute=false) => {
  return tagGetUrl(tag, {tab: "posts"}, isAbsolute)
}

export const tagGetCommentLink = ({tagSlug, commentId, tagCommentType = "DISCUSSION", isAbsolute=false}: {
  tagSlug: string,
  commentId?: string,
  tagCommentType: TagCommentType,
  isAbsolute?: boolean,
}): string => {
  const base = tagCommentType === "DISCUSSION" ? tagGetDiscussionUrl({slug: tagSlug}, isAbsolute) : tagGetSubforumUrl({slug: tagSlug}, isAbsolute)

  // Bit of a hack to make it work whether or not there are already query params, if this breaks just parse the URL properly
  return commentId ? `${base}${base.includes('?') ? "&" : "?"}commentId=${commentId}` : base
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

export const userCanModerateSubforum = (user: UsersCurrent | DbUser | null, tag: { subforumModeratorIds: string[] }) => {
  if (!user) return false
  if (user.isAdmin || user?.groups?.includes("sunshineRegiment")) return true
  if (tag.subforumModeratorIds?.includes(user._id)) return true
  return false
}

export const userIsSubforumModerator = (user: DbUser|UsersCurrent|null, tag: DbTag): boolean => {
  if (!user || !tag) return false;
  return tag.subforumModeratorIds?.includes(user._id);
}
