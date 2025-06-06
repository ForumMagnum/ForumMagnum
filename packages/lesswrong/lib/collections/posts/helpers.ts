import { PublicInstanceSetting, aboutPostIdSetting, isAF, isLWorAF, siteUrlSetting } from '../../instanceSettings';
import { getOutgoingUrl, getSiteUrl } from '../../vulcan-lib/utils';
import { userOwns, userCanDo, userOverNKarmaFunc, userIsAdminOrMod, userOverNKarmaOrApproved } from '../../vulcan-users/permissions';
import { userGetDisplayName, userIsSharedOn } from '../users/helpers';
import { postStatuses, postStatusLabels } from './constants';
import { DatabasePublicSetting, cloudinaryCloudNameSetting, commentPermalinkStyleSetting, crosspostKarmaThreshold } from '../../publicSettings';
import { max } from "underscore";
import { TupleSet, UnionOf } from '../../utils/typeGuardUtils';
import type { Request, Response } from 'express';
import pathToRegexp from "path-to-regexp";
import type { RouterLocation } from '../../vulcan-lib/routes';

export const postCategories = new TupleSet(['post', 'linkpost', 'question'] as const);
export type PostCategory = UnionOf<typeof postCategories>;
export const postDefaultCategory = 'post';
export const isPostCategory = (tab: string): tab is PostCategory => postCategories.has(tab)

//////////////////
// Link Helpers //
//////////////////

// Return a post's link if it has one, else return its post page URL
export const postGetLink = function (post: PostsBase|DbPost, isAbsolute=false, isRedirected=true): string {
  if (post.url) {
    return isRedirected ? getOutgoingUrl(post.url) : post.url;
  }
  return postGetPageUrl(post, isAbsolute);
};

// Whether a post's link should open in a new tab or not
export const postGetLinkTarget = function (post: PostsBase|DbPost): string {
  return !!post.url ? '_blank' : '';
};

///////////////////
// Other Helpers //
///////////////////

// Get a post author's name
export const postGetAuthorName = async function (post: DbPost, context: ResolverContext): Promise<string> {
  var user = await context.Users.findOne({_id: post.userId});
  if (user) {
    return userGetDisplayName(user);
  } else {
    return post.author ?? "[unknown author]";
  }
};

// Get default status for new posts.
export const postGetDefaultStatus = function (user: DbUser): number {
  return postStatuses.STATUS_APPROVED;
};

const findWhere = (array: any, criteria: any) => array.find((item: any) => Object.keys(criteria).every((key: any) => item[key] === criteria[key]));

// Get status name
export const postGetStatusName = function (post: DbPost): string {
  return findWhere(postStatusLabels, {value: post.status}).label;
};

// Check if a post is approved
export const postIsApproved = function (post: Pick<DbPost, '_id' | 'status'>): boolean {
  return post.status === postStatuses.STATUS_APPROVED;
};

// Get URL for sharing on Twitter.
export const postGetTwitterShareUrl = (post: DbPost): string => {
  return `https://twitter.com/intent/tweet?text=${ encodeURIComponent(post.title) }%20${ encodeURIComponent(postGetLink(post, true)) }`;
};

// Get URL for sharing on Facebook.
export const postGetFacebookShareUrl = (post: DbPost): string => {
  return `https://www.facebook.com/sharer/sharer.php?u=${ encodeURIComponent(postGetLink(post, true)) }`;
};

// Get URL for sharing by Email.
export const postGetEmailShareUrl = (post: DbPost): string => {
  const subject = `Interesting link: ${post.title}`;
  const body = `I thought you might find this interesting:

${post.title}
${postGetLink(post, true, false)}

(found via ${siteUrlSetting.get()})
  `;
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

const getSocialImagePreviewPrefix = () =>
  `https://res.cloudinary.com/${cloudinaryCloudNameSetting.get()}/image/upload/c_fill,ar_1.91,g_auto/`;

// Select the social preview image for the post.
// For events, we use their event image if that is set.
// For other posts, we use the manually-set cloudinary image if available,
// or the auto-set from the post contents. If neither of those are available,
// it will return null.
export const getSocialPreviewImage = (post: DbPost): string => {
  // Note: in case of bugs due to failed migration of socialPreviewImageId -> socialPreview.imageId,
  // edit this to support the old field "socialPreviewImageId", which still has the old data
  const manualId = (post.isEvent && post.eventImageId) ? post.eventImageId : post.socialPreview?.imageId
  if (manualId) {
    return getSocialImagePreviewPrefix() + manualId;
  }
  const autoUrl = post.socialPreviewImageAutoUrl
  return autoUrl || ''
}

export const getSocialPreviewSql = (tablePrefix: string) => `JSON_BUILD_OBJECT(
  'imageUrl',
  CASE
    WHEN ${tablePrefix}."isEvent" AND ${tablePrefix}."eventImageId" IS NOT NULL
      THEN '${getSocialImagePreviewPrefix()}' || ${tablePrefix}."eventImageId"
    WHEN ${tablePrefix}."socialPreview"->>'imageId' IS NOT NULL
      THEN '${getSocialImagePreviewPrefix()}' || (${tablePrefix}."socialPreview"->>'imageId')
    ELSE COALESCE(${tablePrefix}."socialPreviewImageAutoUrl", '')
  END
)`;

// The set of fields required for calling postGetPageUrl. Could be supplied by
// either a fragment or a DbPost.
export interface PostsMinimumForGetPageUrl {
  _id: string
  slug: string
  isEvent?: boolean
  groupId?: string | undefined | null
}

// Get URL of a post page.
export const postGetPageUrl = function(post: PostsMinimumForGetPageUrl, isAbsolute=false, sequenceId: string|null=null): string {
  const prefix = isAbsolute ? getSiteUrl().slice(0,-1) : '';

  // LESSWRONG – included event and group post urls
  if (sequenceId) {
    return `${prefix}/s/${sequenceId}/p/${post._id}`;
  } else if (post.isEvent) {
    return `${prefix}/events/${post._id}/${post.slug}`;
  } else if (post.groupId) {
    return `${prefix}/g/${post.groupId}/p/${post._id}/`;
  }
  return `${prefix}/posts/${post._id}/${post.slug}`;
};

export const postGetCommentsUrl = (
  post: PostsMinimumForGetPageUrl,
  isAbsolute = false,
  sequenceId: string | null = null,
): string => {
  return postGetPageUrl(post, isAbsolute, sequenceId) + "#comments";
}

export const getPostCollaborateUrl = function (postId: string, isAbsolute=false, linkSharingKey?: string): string {
  const prefix = isAbsolute ? getSiteUrl().slice(0,-1) : '';
  if (linkSharingKey) {
    return `${prefix}/collaborateOnPost?postId=${postId}&key=${linkSharingKey}`;
  } else {
    return `${prefix}/collaborateOnPost?postId=${postId}`;
  }
}

export const postGetEditUrl = (postId: string, isAbsolute = false, linkSharingKey?: string, version?: string): string => {
  const prefix = isAbsolute ? getSiteUrl().slice(0, -1) : '';
  let url = `${prefix}/editPost?postId=${postId}`;
  if (linkSharingKey) url += `&key=${linkSharingKey}`;
  if (version) url += `&version=${version}`;
  return url;
}

export type PostWithCommentCounts = { commentCount: number; afCommentCount: number }
/**
 * Get the total (cached) number of comments, including replies and answers
 */
export const postGetCommentCount = (post: PostWithCommentCounts): number => {
  if (isAF) {
    return post.afCommentCount || 0;
  } else {
    return post.commentCount || 0;
  }
};

/**
 * Can pass in a manual comment count, or retrieve the post's cached comment count
 */
export const postGetCommentCountStr = (post?: PostWithCommentCounts|null, commentCount?: number|undefined): string => {
  const count = commentCount !== undefined ? commentCount : post ? postGetCommentCount(post) : 0;
  if (!count) {
    return "No comments";
  } else if (count === 1) {
    return "1 comment";
  } else {
    return count + " comments";
  }
}

export const postGetAnswerCountStr = (count: number): string => {
  if (!count) {
    return "No answers";
  } else if (count === 1) {
    return "1 answer";
  } else {
    return count + " answers";
  }
}

export const getResponseCounts = ({ post, answers }: { post: PostWithCommentCounts; answers: CommentsList[] }) => {
  // answers may include some which are deleted:true, deletedPublic:true (in which
  // case various fields are unpopulated and a deleted-item placeholder is shown
  // in the UI). These deleted answers are *not* included in post.commentCount.
  const nonDeletedAnswers = answers.filter((answer) => !answer.deleted);

  const answerAndDescendentsCount =
    answers.reduce((prev: number, curr: CommentsList) => prev + curr.descendentCount, 0) + answers.length;

  return {
    answerCount: nonDeletedAnswers.length,
    commentCount: postGetCommentCount(post) - answerAndDescendentsCount,
  };
};

export const postGetLastCommentedAt = (post: PostsBase|DbPost): Date | null => {
  if (isAF) {
    return post.afLastCommentedAt;
  } else {
    return post.lastCommentedAt;
  }
}

export const postGetLastCommentPromotedAt = (post: PostsBase|DbPost): Date|null => {
  if (isAF) return null
  // TODO: add an afLastCommentPromotedAt
  return post.lastCommentPromotedAt;
}

/**
 * Whether or not the given user is an organizer for the post's group
 * @param user
 * @param post
 * @returns {Promise} Promise object resolves to true if the post has a group and the user is an organizer for that group
 */
export const userIsPostGroupOrganizer = async (user: UsersMinimumInfo|DbUser|null, post: PostsBase|DbPost, context: ResolverContext): Promise<boolean> => {
  const { loaders } = context;

  const groupId = ('group' in post) ? post.group?._id : post.groupId;
  if (!user || !groupId)
    return false
    
  const group = await loaders.Localgroups.load(groupId);
  return !!group && group.organizerIds.some(id => id === user._id);
}

/**
 * Whether the user can make updates to the post document (including both the main post body and most other post fields)
 */
export const canUserEditPostMetadata = (currentUser: UsersCurrent|DbUser|null, post: PostsBase|DbPost): boolean => {
  if (!currentUser) return false;

  const organizerIds = (post as PostsBase)?.group?.organizerIds;
  const isPostGroupOrganizer = organizerIds ? organizerIds.some(id => id === currentUser?._id) : false;
  if (isPostGroupOrganizer) return true

  if (userOwns(currentUser, post)) return true
  if (userCanDo(currentUser, 'posts.edit.all')) return true
  // Shared as a coauthor? Always give access
  if (post.coauthorStatuses && post.coauthorStatuses.findIndex(({ userId }) => userId === currentUser._id) >= 0) return true

  if (userIsSharedOn(currentUser, post) && post.sharingSettings?.anyoneWithLinkCan === "edit") return true 

  if (post.shareWithUsers?.includes(currentUser._id) && post.sharingSettings?.explicitlySharedUsersCan === "edit") return true 

  return false
}

export const postCanDelete = (currentUser: UsersCurrent|null, post: PostsBase): boolean => {
  if (userCanDo(currentUser, "posts.remove.all")) {
    return true
  }
  const organizerIds = post.group?.organizerIds;
  const isPostGroupOrganizer = organizerIds ? organizerIds.some(id => id === currentUser?._id) : false;
  return (userOwns(currentUser, post) || isPostGroupOrganizer) && !!post.draft
}

export const postGetKarma = (post: PostsBase|DbPost): number => {
  const baseScore = isAF ? post.afBaseScore : post.baseScore
  return baseScore || 0
}

// User can add/edit the hideCommentKarma setting if:
//  1) The user is logged in and has the requisite setting enabled
//  And
//  2) The post does not exist yet
//  Or if the post does exist
//  3) The post doesn't have any comments yet
export const postCanEditHideCommentKarma = (user: UsersCurrent|DbUser|null, post?: PostWithCommentCounts|null): boolean => {
  return !!(user?.showHideKarmaOption && (!post || !postGetCommentCount(post)))
}

export type CoauthoredPost = NullablePartial<Pick<DbPost, "hasCoauthorPermission" | "coauthorStatuses">>

export const postCoauthorIsPending = (post: CoauthoredPost, coauthorUserId: string) => {
  if (post.hasCoauthorPermission) {
    return false;
  }
  const status = post.coauthorStatuses?.find(({ userId }) => coauthorUserId === userId);
  return status && !status.confirmed;
}

export const getConfirmedCoauthorIds = (post: CoauthoredPost): string[] => {
  let { coauthorStatuses, hasCoauthorPermission = true } = post;
  if (!coauthorStatuses) return []

  if (!hasCoauthorPermission) {
    coauthorStatuses = coauthorStatuses.filter(({ confirmed }) => confirmed);
  }
  return coauthorStatuses.map(({ userId }) => userId);
}

export const userIsPostCoauthor = (user: UsersMinimumInfo|DbUser|null, post: CoauthoredPost): boolean => {
  if (!user) {
    return false;
  }
  const userIds = getConfirmedCoauthorIds(post);
  return userIds.indexOf(user._id) >= 0;
}

export const isNotHostedHere = (post: PostsEditQueryFragment|PostsPage|DbPost) => {
  return post?.fmCrosspost?.isCrosspost && !post?.fmCrosspost?.hostedHere
}

const mostRelevantTag = (
  tags: TagBasicInfo[],
  tagRelevance: Record<string, number>,
): TagBasicInfo | null => max(tags, ({_id}) => tagRelevance[_id] ?? 0);

export const postGetPrimaryTag = (post: PostsListWithVotes, includeNonCore = false) => {
  const {tags, tagRelevance} = post;
  const core = tags.filter(({core}) => core);
  const potentialTags = core.length < 1 && includeNonCore ? tags : core;
  const result = mostRelevantTag(potentialTags, tagRelevance);
  return typeof result === "object" ? result : undefined;
}

export const allowTypeIIIPlayerSetting = new PublicInstanceSetting<boolean>('allowTypeIIIPlayer', false, "optional")
const type3DateCutoffSetting = new DatabasePublicSetting<string>('type3.cutoffDate', '2023-05-01')
const type3ExplicitlyAllowedPostIdsSetting = new DatabasePublicSetting<string[]>('type3.explicitlyAllowedPostIds', [])
/** type3KarmaCutoffSetting is here to allow including high karma posts from before type3DateCutoffSetting */
const type3KarmaCutoffSetting = new DatabasePublicSetting<number>('type3.karmaCutoff', Infinity)

/**
 * Whether the post is allowed AI generated audio
 */
export const isPostAllowedType3Audio = (post: PostsBase|DbPost): boolean => {
  if (!allowTypeIIIPlayerSetting.get()) return false

  try {
    const TYPE_III_DATE_CUTOFF = new Date(type3DateCutoffSetting.get())
    const TYPE_III_ALLOWED_POST_IDS = type3ExplicitlyAllowedPostIdsSetting.get()

    return (
      (new Date(post.postedAt) >= TYPE_III_DATE_CUTOFF ||
        TYPE_III_ALLOWED_POST_IDS.includes(post._id) ||
        post.baseScore > type3KarmaCutoffSetting.get() ||
        post.forceAllowType3Audio) &&
      !post.draft &&
      !post.authorIsUnreviewed &&
      !post.rejected &&
      !post.podcastEpisodeId &&
      !post.isEvent &&
      !post.question &&
      !post.debate &&
      !post.shortform &&
      post.status === postStatuses.STATUS_APPROVED
    );
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    return false
  }
}

/**
 * Given a url like https://docs.google.com/document/d/1G4SNqovdoEHaHca20TPJA6D4Ck7Yo8ocvKdwdZdL5qA/edit#heading=h.82kaw9idgbpe
 * return just the id part (1G4SNqovdoEHaHca20TPJA6D4Ck7Yo8ocvKdwdZdL5qA in this case)
 */
export const extractGoogleDocId = (urlOrId: string): string | null => {
  const docIdMatch = urlOrId.match(/.*docs\.google\.com.*\/d\/(.+?)(\/|$)/);
  return docIdMatch ? docIdMatch[1] : null;
};

/**
 * Given a Google doc id like 1G4SNqovdoEHaHca20TPJA6D4Ck7Yo8ocvKdwdZdL5qA, return
 * the full url (as if you were able to edit it). In this case it would be
 * https://docs.google.com/document/d/1G4SNqovdoEHaHca20TPJA6D4Ck7Yo8ocvKdwdZdL5qA/edit
 */
export const googleDocIdToUrl = (docId: string): string => {
  return `https://docs.google.com/document/d/${docId}/edit`;
};

export const postRouteWillDefinitelyReturn200 = async (req: Request, res: Response, parsedRoute: RouterLocation, context: ResolverContext) => {
  const matchPostPath = pathToRegexp('/posts/:_id/:slug?');
  const [_, postId] = matchPostPath.exec(req.path) ?? [];

  if (postId) {
    if (req.query.commentId && commentPermalinkStyleSetting.get() === 'in-context') {
      // Will redirect from ?commentId=... to #...
      return false;
    }

    return await context.repos.posts.postRouteWillDefinitelyReturn200(postId);
  }
  return false;
}

export const isRecombeeRecommendablePost = (post: Pick<DbPost, keyof PostsBase & keyof DbPost> | PostsBase): boolean => {
  // We explicitly don't check `isFuture` here, because the cron job that "publishes" those posts does a raw update
  // So it won't trigger any of the callbacks, and if we exclude those posts they'll never get recommended
  // `Posts.checkAccess` already filters out posts with `isFuture` unless you're a mod or otherwise own the post
  // So we're not really in any danger of showing those posts to regular users
  // TODO: figure out how to handle this more gracefully
  return !(
    post.shortform
    || post.unlisted
    || post.rejected
    || post.isEvent
    || !!post.groupId
    || post.disableRecommendation
    || post.status !== 2
    || post._id === aboutPostIdSetting.get()
  );
};

export const postIsPublic = (post: Pick<DbPost, '_id' | 'draft' | 'status'>) => {
  return !post.draft && post.status === postStatuses.STATUS_APPROVED
};

export type PostParticipantInfo = NullablePartial<Pick<PostsDetails, "userId"|"debate"|"hasCoauthorPermission" | "coauthorStatuses">>;

export function isDialogueParticipant(userId: string, post: PostParticipantInfo) {
  if (post.userId === userId) return true 
  if (getConfirmedCoauthorIds(post).includes(userId)) return true
  return false
}

export type EditablePost = UpdatePostDataInput & {
  _id: string;
  tags: Array<TagBasicInfo>;
  autoFrontpage?: DbPost['autoFrontpage'];
  socialPreviewData: Post['socialPreviewData'];
  user: PostsEdit['user'];
  commentCount: number;
  afCommentCount: number;
  contents: CreateRevisionDataInput & { html: string | null } | null;
  debate: boolean;
} & Pick<PostsListBase, 'postCategory' | 'createdAt'>;

export interface PostSubmitMeta {
  redirectToEditor?: boolean;
  successCallback?: (editedPost: PostsEditMutationFragment) => void;
}

export const DEFAULT_QUALITATIVE_VOTE = 4;

export const MINIMUM_COAUTHOR_KARMA = 1;

export interface RSVPType {
  name: string;
  email: string;
  nonPublic: boolean;
  response: "yes" | "maybe" | "no";
  userId: string;
  createdAt: Date;
}

/**
 * Structured this way to ensure lazy evaluation of `crosspostKarmaThreshold` each time we check for a given user, rather than once on server start
 */
export const userPassesCrosspostingKarmaThreshold = (user: DbUser | UsersMinimumInfo | null) => {
  const currentKarmaThreshold = crosspostKarmaThreshold.get();

  return currentKarmaThreshold === null
    ? true
    : // userOverNKarmaFunc checks greater than, while we want greater than or equal to, since that's the check we're performing elsewhere

    // so just subtract one
    userOverNKarmaFunc(currentKarmaThreshold - 1)(user);
};

export function userCanEditCoauthors(user: UsersCurrent | null) {
  return userIsAdminOrMod(user) || userOverNKarmaOrApproved(MINIMUM_COAUTHOR_KARMA)(user);
}
