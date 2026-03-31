import qs from "qs";
import { forumSelect } from "../../forumTypeUtils";
import { siteUrlSetting, allowTypeIIIPlayerSetting } from '@/lib/instanceSettings';
import { combineUrls, getLinkPrefix } from "../../vulcan-lib/utils";
import { TagCommentType } from "../comments/types";
import type { TagLens } from "@/lib/arbital/useTagLenses";
import { getSortOrderOptions, SettingsOption } from "../posts/dropdownOptions";
import type { TagHistorySettings } from "@/components/tagging/history/TagHistoryPage";

export const getTagMinimumKarmaPermissions = () => forumSelect({
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

export type TagMinimumForGetPageUrl = {
  slug: string,
}
type TagGetPageUrlOptions = {
  isAbsolute?: boolean,
  hash?: string,
  edit?: boolean,
  flagId?: string
  lens?: string
  tab?: string
  from?: string,
  pathId?: string
}

export const getTagCreateUrl = () => `/w/create`
export const getTagGradingSchemeUrl = () => `/w/tag-grading-scheme`

export const tagGetPageUrl = (tag: TagMinimumForGetPageUrl, urlOptions?: TagGetPageUrlOptions) => {
  const urlSearchParams = urlOptions
  const isAbsolute = urlOptions?.isAbsolute ?? false;
  const hash = urlOptions?.hash ?? '';
  const prefix = getLinkPrefix({isAbsolute});
  const search = qs.stringify(urlSearchParams)

  const searchSuffix = search ? `?${search}` : ''
  const hashSuffix = hash ? `#${hash}` : ''

  return `${prefix}/w/${tag.slug}${searchSuffix}${hashSuffix}`
}

export const tagGetHistoryUrl = (tag: {slug: string}) => `/w/${tag.slug}/history`

export const tagGetDiscussionUrl = (tag: {slug: string}, isAbsolute=false) => {
  const suffix = `/w/${tag.slug}/discussion`
  return isAbsolute ? combineUrls(siteUrlSetting.get(), suffix) : suffix
}

export const tagGetSubforumUrl = (tag: {slug: string}, isAbsolute=false) => {
  return tagGetPageUrl(tag, {tab: "posts", isAbsolute})
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

// TODO: Is this necessary if we instead have version as a search param in the main tagGetPageUrl function?
export const tagGetRevisionLink = (tag: DbTag|TagBasicInfo, versionNumber: string, lens?: MultiDocumentContentDisplay|TagLens): string => {
  const lensParam = lens ? `lens=${lens.slug}&` : "";
  return `/w/${tag.slug}?${lensParam}version=${versionNumber}`;
}

export const tagUserHasSufficientKarma = (user: UsersCurrent | DbUser | null, action: "new" | "edit"): boolean => {
  if (!user) return false
  if (user.isAdmin) return true
  if ((user.karma) >= getTagMinimumKarmaPermissions()[action]) return true
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
>(
  tagInfo: Array<{ tag: T; tagRel: TR }>,
  options?: { coreTags?: "first"|"last" },
): Array<{ tag: T; tagRel: TR }> {
  const coreTagsSort = (options?.coreTags === "first" ? 1 : -1);

  return [...tagInfo].sort((a, b) => {
    const tagA = a.tag;
    const tagB = b.tag;
    const tagRelA = a.tagRel;
    const tagRelB = b.tagRel;

    if (tagA.core !== tagB.core) {
      // Core tags come first unless options?.coreTags is "last"
      return (tagA.core ? -1 : 1) * coreTagsSort;
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

export const isTagAllowedType3Audio = (tag: TagPageFragment|DbTag): boolean => {
  if (!allowTypeIIIPlayerSetting.get()) return false

  return !!tag.forceAllowType3Audio && !!tag.description && !tag.deleted
};

export const getTagPostsSortOrderOptions = () => ({
  relevance: { label: "Most Relevant" },
  ...getSortOrderOptions(),
} satisfies Record<string, SettingsOption>);

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

