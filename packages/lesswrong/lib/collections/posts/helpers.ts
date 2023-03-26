import { forumTypeSetting, siteUrlSetting } from '../../instanceSettings';
import { getOutgoingUrl, getSiteUrl } from '../../vulcan-lib/utils';
import { mongoFindOne } from '../../mongoQueries';
import { userOwns, userCanDo } from '../../vulcan-users/permissions';
import { userGetDisplayName, userIsSharedOn } from '../users/helpers';
import { postStatuses, postStatusLabels } from './constants';
import { cloudinaryCloudNameSetting } from '../../publicSettings';
import Localgroups from '../localgroups/collection';
import moment from '../../moment-timezone';


//////////////////
// Link Helpers //
//////////////////

// Return a post's link if it has one, else return its post page URL
export const postGetLink = function (post: PostsBase|DbPost, isAbsolute=false, isRedirected=true): string {
  const foreignId = "fmCrosspost" in post && post.fmCrosspost?.isCrosspost && !post.fmCrosspost.hostedHere
    ? post.fmCrosspost.foreignPostId
    : undefined;
  const url = isRedirected ? getOutgoingUrl(post.url, foreignId ?? undefined) : post.url;
  return !!post.url ? url : postGetPageUrl(post, isAbsolute);
};

// Whether a post's link should open in a new tab or not
export const postGetLinkTarget = function (post: PostsBase|DbPost): string {
  return !!post.url ? '_blank' : '';
};

///////////////////
// Other Helpers //
///////////////////

// Get a post author's name
export const postGetAuthorName = async function (post: DbPost) {
  var user = await mongoFindOne("Users", post.userId);
  if (user) {
    return userGetDisplayName(user);
  } else {
    return post.author;
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
export const postIsApproved = function (post: DbPost): boolean {
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

// Select the social preview image for the post, using the manually-set
// cloudinary image if available, or the auto-set from the post contents. If
// neither of those are available, it will return null.
export const getSocialPreviewImage = (post: DbPost): string => {
  const manualId = post.socialPreviewImageId
  if (manualId) return `https://res.cloudinary.com/${cloudinaryCloudNameSetting.get()}/image/upload/c_fill,ar_1.91,g_auto/${manualId}`
  const autoUrl = post.socialPreviewImageAutoUrl
  return autoUrl || ''
}

// The set of fields required for calling postGetPageUrl. Could be supplied by
// either a fragment or a DbPost.
export interface PostsMinimumForGetPageUrl {
  _id: string
  slug: string
  isEvent?: boolean
  groupId?: string|undefined
}

// Get URL of a post page.
export const postGetPageUrl = function(post: PostsMinimumForGetPageUrl, isAbsolute=false, sequenceId:string|null=null): string {
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

export const getPostCollaborateUrl = function (postId: string, isAbsolute=false, linkSharingKey?: string): string {
  const prefix = isAbsolute ? getSiteUrl().slice(0,-1) : '';
  if (linkSharingKey) {
    return `${prefix}/collaborateOnPost?postId=${postId}&key=${linkSharingKey}`;
  } else {
    return `${prefix}/collaborateOnPost?postId=${postId}`;
  }
}

export const postGetEditUrl = function(postId: string, isAbsolute=false, linkSharingKey?: string): string {
  const prefix = isAbsolute ? getSiteUrl().slice(0,-1) : '';
  if (linkSharingKey) {
    return `${prefix}/editPost?postId=${postId}&key=${linkSharingKey}`;
  } else {
    return `${prefix}/editPost?postId=${postId}`;
  }
}

export const postGetCommentCount = (post: PostsBase|DbPost|PostSequenceNavigation_nextPost|PostSequenceNavigation_prevPost): number => {
  if (forumTypeSetting.get() === 'AlignmentForum') {
    return post.afCommentCount || 0;
  } else {
    return post.commentCount || 0;
  }
}

/**
 * Can pass in a manual comment count, or retrieve the post's cached comment count
 */
export const postGetCommentCountStr = (post?: PostsBase|DbPost|null, commentCount?: number|undefined): string => {
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

export const postGetLastCommentedAt = (post: PostsBase|DbPost): Date => {
  if (forumTypeSetting.get() === 'AlignmentForum') {
    return post.afLastCommentedAt;
  } else {
    return post.lastCommentedAt;
  }
}

export const postGetLastCommentPromotedAt = (post: PostsBase|DbPost):Date|null => {
  if (forumTypeSetting.get() === 'AlignmentForum') return null
  // TODO: add an afLastCommentPromotedAt
  return post.lastCommentPromotedAt;
}

/**
 * Whether or not the given user is an organizer for the post's group
 * @param user
 * @param post
 * @returns {Promise} Promise object resolves to true if the post has a group and the user is an organizer for that group
 */
export const userIsPostGroupOrganizer = async (user: UsersMinimumInfo|DbUser|null, post: PostsBase|DbPost): Promise<boolean> => {
  const groupId = ('group' in post) ? post.group?._id : post.groupId;
  if (!user || !groupId)
    return false
    
  const group = await Localgroups.findOne({_id: groupId});
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
  if (post.coauthorStatuses?.findIndex(({ userId }) => userId === currentUser._id) >= 0) return true

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
  return (userOwns(currentUser, post) || isPostGroupOrganizer) && post.draft
}

export const postGetKarma = (post: PostsBase|DbPost): number => {
  const baseScore = forumTypeSetting.get() === 'AlignmentForum' ? post.afBaseScore : post.baseScore
  return baseScore || 0
}

// User can add/edit the hideCommentKarma setting if:
//  1) The user is logged in and has the requisite setting enabled
//  And
//  2) The post does not exist yet
//  Or if the post does exist
//  3) The post doesn't have any comments yet
export const postCanEditHideCommentKarma = (user: UsersCurrent|DbUser|null, post?: PostsBase|DbPost|null): boolean => {
  return !!(user?.showHideKarmaOption && (!post || !postGetCommentCount(post)))
}

/**
 * Returns the event datetimes in a user-friendly format,
 * ex: Mon, Jan 3 at 4:30 - 5:30 PM
 * 
 * @param {(PostsBase|DbPost)} post - The event to be checked.
 * @param {string} [timezone] - (Optional) Convert datetimes to this timezone.
 * @param {string} [dense] - (Optional) Exclude the day of the week.
 * @returns {string} The formatted event datetimes.
 */
export const prettyEventDateTimes = (post: PostsBase|DbPost, timezone?: string, dense?: boolean): string => {
  // when no start time, just show "TBD"
  if (!post.startTime) return 'TBD'
  
  let start = moment(post.startTime)
  let end = post.endTime && moment(post.endTime)
  // if we have event times in the local timezone, use those instead
  const useLocalTimes = post.localStartTime && (!post.endTime || post.localEndTime)

  // prefer to use the provided timezone
  let tz = ` ${start.format('[UTC]ZZ')}`
  if (timezone) {
    start = start.tz(timezone)
    end = end && end.tz(timezone)
    tz = ` ${start.format('z')}`
  } else if (useLocalTimes) {
    // see postResolvers.ts for more on how local times work
    start = moment(post.localStartTime).utc()
    end = post.localEndTime && moment(post.localEndTime).utc()
    tz = ''
  }
  
  // hide the year if it's reasonable to assume it
  const now = moment()
  const sixMonthsFromNow = moment().add(6, 'months')
  const startYear = (now.isSame(start, 'year') || start.isBefore(sixMonthsFromNow)) ? '' : `, ${start.format('YYYY')}`
  
  const startDate = dense ? start.format('MMM D') : start.format('ddd, MMM D')
  const startTime = start.format('h:mm').replace(':00', '')
  let startAmPm = ` ${start.format('A')}`
  
  if (!end) {
    // just a start time
    // ex: Starts on Mon, Jan 3 at 4:30 PM
    // ex: Starts on Mon, Jan 3, 2023 at 4:30 PM EST
    return `${dense ? '' : 'Starts on '}${startDate}${startYear} at ${startTime}${startAmPm}${tz}`
  }

  const endTime = end.format('h:mm A').replace(':00', '')
  // start and end time on the same day
  // ex: Mon, Jan 3 at 4:30 - 5:30 PM
  // ex: Mon, Jan 3, 2023 at 4:30 - 5:30 PM EST
  if (start.isSame(end, 'day')) {
    // hide the start time am/pm if it's the same as the end time's
    startAmPm = start.format('A') === end.format('A') ? '' : startAmPm
    return `${startDate}${startYear} at ${startTime}${startAmPm} - ${endTime}${tz}`
  }

  // start and end time on different days
  // ex: Mon, Jan 3 at 4:30 PM - Tues, Jan 4 at 5:30 PM
  // ex: Mon, Jan 3, 2023 at 4:30 PM - Tues, Jan 4, 2023 at 5:30 PM EST
  const endDate = dense ? end.format('MMM D') : end.format('ddd, MMM D')
  const endYear = (now.isSame(end, 'year') || end.isBefore(sixMonthsFromNow)) ? '' : `, ${end.format('YYYY')}`
  return `${startDate}${startYear} at ${startTime}${startAmPm} - ${endDate}${endYear} at ${endTime}${tz}`
}

export type CoauthoredPost = Pick<DbPost, "hasCoauthorPermission" | "coauthorStatuses">

export const postCoauthorIsPending = (post: CoauthoredPost, coauthorUserId: string) => {
  if (post.hasCoauthorPermission) {
    return false;
  }
  const status = post.coauthorStatuses.find(({ userId }) => coauthorUserId === userId);
  return status && !status.confirmed;
}

export const getConfirmedCoauthorIds = (post: CoauthoredPost): string[] => {
  let { coauthorStatuses = [], hasCoauthorPermission = true } = post;
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

export const isNotHostedHere = (post: PostsPage|DbPost) => {
  return post?.fmCrosspost?.isCrosspost && !post?.fmCrosspost?.hostedHere
}
