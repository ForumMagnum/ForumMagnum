import qs from "qs";
import { forumSelect } from "../../forumTypeUtils";
import { siteUrlSetting, tagUrlBaseSetting } from "../../instanceSettings";
import { combineUrls } from "../../vulcan-lib/utils";
import { TagCommentType } from "../comments/types";
import { isFriendlyUI, preferredHeadingCase } from "../../../themes/forumTheme";
import type { RouterLocation } from '../../vulcan-lib/routes';
import type { Request, Response } from 'express';
import type { TagLens } from "@/lib/arbital/useTagLenses";
import { allowTypeIIIPlayerSetting } from "../posts/helpers";
import { SORT_ORDER_OPTIONS, SettingsOption } from "../posts/dropdownOptions";
import type { TagHistorySettings } from "@/components/tagging/history/TagHistoryPage";

export const tagMinimumKarmaPermissions = forumSelect({
  // Topic spampocalypse defense
  EAForum: {
    new: 1,
    edit: 1,
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
  lens?: string
  tab?: string
  from?: string,
  pathId?: string
}

export const tagCreateUrl = `/${tagUrlBaseSetting.get()}/create`
export const tagGradingSchemeUrl = `/${tagUrlBaseSetting.get()}/tag-grading-scheme`

export const tagGetUrl = (tag: {slug: string}, urlOptions?: GetUrlOptions, isAbsolute=false, hash?: string) => {
  const urlSearchParams = urlOptions
  const search = qs.stringify(urlSearchParams)

  const searchSuffix = search ? `?${search}` : ''
  const hashSuffix = hash ? `#${hash}` : ''

  const url = `/${tagUrlBaseSetting.get()}/${tag.slug}`
  const urlWithSuffixes = `${url}${searchSuffix}${hashSuffix}`
  return isAbsolute ? combineUrls(siteUrlSetting.get(), urlWithSuffixes) : urlWithSuffixes
}

export const tagGetHistoryUrl = (tag: {slug: string}) => `/${tagUrlBaseSetting.get()}/${tag.slug}/history`

export const tagGetDiscussionUrl = (tag: {slug: string}, isAbsolute=false) => {
  const suffix = `/${tagUrlBaseSetting.get()}/${tag.slug}/discussion`
  return isAbsolute ? combineUrls(siteUrlSetting.get(), suffix) : suffix
}

export const tagGetSubforumUrl = (tag: {slug: string}, isAbsolute=false) => {
  return tagGetUrl(tag, {tab: "posts"}, isAbsolute)
}

export const tagGetCommentLink = ({tagSlug, commentId, tagCommentType = "DISCUSSION", isAbsolute=false}: {
  tagSlug: string,
  commentId?: string | null,
  tagCommentType: TagCommentType,
  isAbsolute?: boolean,
}): string => {
  const base = tagCommentType === "DISCUSSION" ? tagGetDiscussionUrl({slug: tagSlug}, isAbsolute) : tagGetSubforumUrl({slug: tagSlug}, isAbsolute)

  // Bit of a hack to make it work whether or not there are already query params, if this breaks just parse the URL properly
  return commentId ? `${base}${base.includes('?') ? "&" : "?"}commentId=${commentId}` : base
}

// TODO: Is this necessary if we instead have version as a search param in the main tagGetUrl function?
export const tagGetRevisionLink = (tag: DbTag|TagBasicInfo, versionNumber: string, lens?: MultiDocumentContentDisplay|TagLens): string => {
  const lensParam = lens ? `lens=${lens.slug}&` : "";
  return `/${tagUrlBaseSetting.get()}/${tag.slug}?${lensParam}version=${versionNumber}`;
}

export const tagUserHasSufficientKarma = (user: UsersCurrent | DbUser | null, action: "new" | "edit"): boolean => {
  if (!user) return false
  if (user.isAdmin) return true
  if ((user.karma) >= tagMinimumKarmaPermissions[action]) return true
  return false
}

export const userCanModerateSubforum = (user: UsersCurrent | DbUser | null, tag: { subforumModeratorIds: string[] }) => {
  if (!user) return false
  if (user.isAdmin || user?.groups?.includes("sunshineRegiment")) return true
  if (tag.subforumModeratorIds?.includes(user._id)) return true
  return false
}

export const userIsSubforumModerator = (user: DbUser|UsersCurrent|null, tag: Pick<DbTag, "subforumModeratorIds">): boolean => {
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

export const EA_FORUM_COMMUNITY_TOPIC_ID = 'ZCihBFp5P64JCvQY6';
export const EA_FORUM_TRANSLATION_TOPIC_ID = 'f4d3KbWLszzsKqxej';
export const EA_FORUM_APRIL_FOOLS_DAY_TOPIC_ID = '4saLTjJHsbduczFti';

export const isTagAllowedType3Audio = (tag: TagPageFragment|DbTag): boolean => {
  if (!allowTypeIIIPlayerSetting.get()) return false

  return !!tag.forceAllowType3Audio && !!tag.description && !tag.deleted
};

export const TAG_POSTS_SORT_ORDER_OPTIONS = {
  relevance: { label: preferredHeadingCase("Most Relevant") },
  ...SORT_ORDER_OPTIONS,
} satisfies Record<string, SettingsOption>;

export const defaultTagHistorySettings: TagHistorySettings = {
  //displayFormat: "dense",
  displayFormat: "expanded",
  showEdits: true,
  showSummaryEdits: true,
  showComments: true,
  showTagging: true,
  showMetadata: true,
  lensId: "all",
};

