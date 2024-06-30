import qs from "qs";
import { forumSelect } from "../../forumTypeUtils";
import { siteUrlSetting, taggingNameIsSet, taggingNamePluralSetting } from "../../instanceSettings";
import { combineUrls } from "../../vulcan-lib";
import { TagCommentType } from "../comments/types";
import Users from "../users/collection";
import { isFriendlyUI } from "../../../themes/forumTheme";
import type { RouterLocation } from '../../vulcan-lib/routes';
import type { Request, Response } from 'express';

export const tagMinimumKarmaPermissions = forumSelect({
  // Topic spampocalypse defense
  EAForum: {
    new: 10,
    edit: 10,
  },
  LessWrong: {
    new: 1,
    edit: 1,
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

  const searchSuffix = search ? `?${search}` : ''
  const hashSuffix = hash ? `#${hash}` : ''

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
  if ((user.karma) >= tagMinimumKarmaPermissions[action]) return true
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

/**
 * Sort tags in order of: core-ness, score, name (alphabetical). If we don't have the scores, sort only by core-ness.
 */
export function stableSortTags<
  T extends {name: string; core: boolean},
  TR extends {baseScore: number} | null | undefined
>(tagInfo: Array<{ tag: T; tagRel: TR }>): Array<{ tag: T; tagRel: TR }> {
  return [...tagInfo].sort((a, b) => {
    const tagA = a.tag;
    const tagB = b.tag;
    const tagRelA = a.tagRel;
    const tagRelB = b.tagRel;

    if (tagA.core !== tagB.core) {
      // Core tags come first with isFriendlyUI, last otherwise
      return (tagA.core ? -1 : 1) * (isFriendlyUI ? 1 : -1);
    }

    if (tagRelA && tagRelB) {
      if (tagRelA.baseScore !== tagRelB.baseScore) {
        return (tagRelB.baseScore || 0) - (tagRelA.baseScore || 0);
      }

      return tagA.name.localeCompare(tagB.name);
    }

    return 0;
  });
}

export const tagRouteWillDefinitelyReturn200 = async (req: Request, res: Response, parsedRoute: RouterLocation, context: ResolverContext) => {
  const tagSlug = parsedRoute.params.slug;
  if (!tagSlug) return false;
  return await context.repos.tags.tagRouteWillDefinitelyReturn200(tagSlug);
}
