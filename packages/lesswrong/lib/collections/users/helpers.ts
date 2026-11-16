import { newUserIconKarmaThresholdSetting, type ForumTypeString } from '@/lib/instanceSettings';
import { combineUrls, getSiteUrl } from '../../vulcan-lib/utils';
import { userOwns, userCanDo, userIsAdmin, userIsMemberOf, PermissionableUser } from '../../vulcan-users/permissions';
import { DeferredForumSelect } from '@/lib/forumTypeUtils';
import { TupleSet, UnionOf } from '@/lib/utils/typeGuardUtils';
import type { ForumIconName } from '@/components/common/ForumIcon';
import type { EditablePost } from '../posts/helpers';
import { maybeDate } from '@/lib/utils/dateUtils';
import moment from 'moment';
import { isE2E } from '@/lib/executionEnvironment';

export const ACCOUNT_DELETION_COOLING_OFF_DAYS = 14;

export function userIsApproved(user: Pick<DbUser, 'reviewedByUserId' | 'snoozedUntilContentCount'> | null | undefined): boolean {
  return !!user?.reviewedByUserId && !user.snoozedUntilContentCount;
}

export type UserDisplayNameInfo = { username?: string | null, fullName?: string | null, displayName: string | null };
export interface PermissionsPostMinimumInfo {
  shortform?: boolean | null,
  user?: PostsAuthors['user'],
  userId: string | null,
  rejected?: boolean | null,
  commentsLocked?: boolean | null,
  commentsLockedToAccountsCreatedAfter?: Date | string | null,
  bannedUserIds?: string[] | null,
  frontpageDate?: Date | string | null,
}

type PostModerationAuthor = PermissionableUser & {
  bannedUserIds?: string[] | null,
  bannedPersonalUserIds?: string[] | null,
};

type AuthorCommentBanReason = "post" | "allPosts" | "allPersonalPosts";

const getAuthorCommentBanMessage = (reason: AuthorCommentBanReason): string => {
  switch (reason) {
    case "allPersonalPosts":
      return "This post's author has blocked you from commenting on any of their personal blog posts.";
    case "post":
    case "allPosts":
      return "This post's author has blocked you from commenting.";
  }
}

// Get a user's display name (not unique, can take special characters and spaces)
export const userGetDisplayName = (user: UserDisplayNameInfo | null, forumType: ForumTypeString): string => {
  if (!user) {
    return "";
  } else {
    return (forumType === 'AlignmentForum'
      ? (user.fullName || user.displayName) ?? ""
      : (user.displayName || getUserName(user)) ?? ""
    ).trim();
  }
};

// Get a user's username (unique, no special characters or spaces)
export const getUserName = function(user: {username?: string | null } | null): string|null {
  try {
    if (user?.username) return user.username;
  } catch (error) {
    console.log(error); // eslint-disable-line
  }
  return null;
};

export const userOwnsAndInGroup = (group: PermissionGroups) => {
  return (user: DbUser, document: HasUserIdType): boolean => {
    return userOwns(user, document) && userIsMemberOf(user, group)
  }
}

/**
 * Count a user as "new" if they have low karma or joined less than a week ago
 */
export const isNewUser = (user: UsersMinimumInfo, forumType: ForumTypeString): boolean => {
  const oneYearInMs = 365*24*60*60*1000;
  const oneWeekInMs = 7*24*60*60*1000;
  const userCreatedAt = new Date(user.createdAt);

  const karmaThreshold = newUserIconKarmaThresholdSetting.get(forumType)
  const userKarma = user.karma;
  const userBelowKarmaThreshold = karmaThreshold && userKarma < karmaThreshold;

  // Only return true for a year after creation if the user remains below the karma threshold
  if (userBelowKarmaThreshold) {
    return userCreatedAt.getTime() > new Date().getTime() - oneYearInMs;
  }
  
  // But continue to return true for a week even if they pass the karma threshold
  return userCreatedAt.getTime() > new Date().getTime() - oneWeekInMs;
}

export interface SharableDocument {
  coauthorUserIds?: DbPost["coauthorUserIds"] | null
  shareWithUsers?: DbPost["shareWithUsers"] | null
  sharingSettings?: DbPost["sharingSettings"]
}

export const userIsSharedOn = (currentUser: DbUser|UsersMinimumInfo|null, document: SharableDocument): boolean => {
  if (!currentUser) return false;
  
  // Shared as a coauthor? Always give access
  const coauthorUserIds = document.coauthorUserIds ?? []
  if (coauthorUserIds.includes(currentUser._id)) {
    return true;
  }
  
  // Explicitly shared?
  if (document.shareWithUsers && document.shareWithUsers.includes(currentUser._id)) {
    return !document.sharingSettings || document.sharingSettings.explicitlySharedUsersCan !== "none";
  } else {
    // If not individually shared with this user, still counts if shared if
    // (1) link sharing is enabled and (2) the user's ID is in
    // linkSharingKeyUsedBy.
    return (
      document.sharingSettings?.anyoneWithLinkCan
      && document.sharingSettings.anyoneWithLinkCan !== "none"
      && ((document as DbPost).linkSharingKeyUsedBy)?.includes(currentUser._id)
    )
  }
}

export const userCanEditUsersBannedUserIds = (currentUser: DbUser|null, targetUser: DbUser): boolean => {
  if (userCanDo(currentUser,"posts.moderate.all")) {
    return true
  }
  if (!currentUser || !targetUser) {
    return false
  }
  return !!(
    userCanDo(currentUser,"posts.moderate.own") &&
    targetUser.moderationStyle
  )
}

export const MODERATE_OWN_PERSONAL_KARMA_THRESHOLD = 50;
export const TRUSTLEVEL1_KARMA_THRESHOLD = 2000;

const postHasModerationGuidelines = (
  post: PostsBase | PostsModerationGuidelines | DbPost,
): boolean => {
  // Because of a bug in Vulcan that doesn't adequately deal with nested fields
  // in document validation, we check for originalContents instead of html here,
  // which causes some problems with empty strings, but should overall be fine
  return !!(
    ("moderationGuidelines_latest" in post && post.moderationGuidelines_latest) ||
    ("moderationGuidelines" in post && post.moderationGuidelines?.originalContents) ||
    post.moderationStyle
  );
}

type ModerationPermission =
  | { canModerate: true, reason: null }
  | { canModerate: false, reason: string };

export const userCanModeratePost = (
  user: UsersProfile|UsersCurrent|DbUser|null,
  post?: PostsBase|PostsModerationGuidelines|DbPost|null,
): ModerationPermission => {
  if (userCanDo(user, "posts.moderate.all")) {
    return { canModerate: true, reason: null };
  }
  if (!user) {
    return { canModerate: false, reason: "You must be logged in to moderate comments." };
  }
  if (!post || !userOwns(user, post)) {
    return { canModerate: false, reason: "Only moderators and the post's author can moderate comments on this post." };
  }
  const canModeratePersonalPosts = userCanDo(user, "posts.moderate.own.personal");
  const canModerateAllOwnPosts = userCanDo(user, "posts.moderate.own");
  if (!canModeratePersonalPosts && !canModerateAllOwnPosts) {
    return { canModerate: false, reason: `You need at least ${MODERATE_OWN_PERSONAL_KARMA_THRESHOLD} karma to moderate comments on your posts.` };
  }
  if (post.frontpageDate && !canModerateAllOwnPosts) {
    return { canModerate: false, reason: `You need at least ${TRUSTLEVEL1_KARMA_THRESHOLD} karma to moderate comments on your frontpage posts.` };
  }
  if (!postHasModerationGuidelines(post)) {
    if (post.shortform) {
      return { canModerate: false, reason: "You can't moderate comments on your quick takes page because it doesn't have moderation guidelines or a moderation style set." };
    }
    return { canModerate: false, reason: "You can only moderate comments on your posts if the post has moderation guidelines or a moderation style set. You can add these by editing the post." };
  }
  return { canModerate: true, reason: null };
}

export const userCanModerateComment = (
  user: UsersProfile|UsersCurrent|DbUser|null,
  post: PostsBase|DbPost|null,
  tag: TagBasicInfo|DbTag|null,
  comment: CommentsList|DbComment,
): ModerationPermission => {
  if (!user) {
    return { canModerate: false, reason: "You must be logged in to delete comments." };
  }
  if (!post && !tag) {
    return { canModerate: false, reason: "Comments that aren't on a post or tag can't be deleted." };
  }
  const ownsComment = userOwns(user, comment);
  if (ownsComment && !comment.directChildrenCount) {
    return { canModerate: true, reason: null };
  }
  const hasRepliesReason = "You can't delete your comment because it has replies. You can retract it instead.";
  if (post) {
    const postPermission = userCanModeratePost(user, post);
    if (!postPermission.canModerate && ownsComment && !userOwns(user, post)) {
      return { canModerate: false, reason: hasRepliesReason };
    }
    return postPermission;
  }
  if (userIsMemberOf(user, "sunshineRegiment")) {
    return { canModerate: true, reason: null };
  }
  if (ownsComment) {
    return { canModerate: false, reason: hasRepliesReason };
  }
  return { canModerate: false, reason: "Only moderators can delete this comment." };
}

export const userCanCommentLock = (user: UsersCurrent|DbUser|null, post: PostsBase | DbPost | (EditablePost & { userId: string | null}) | null): boolean => {
  if (userCanDo(user,"posts.commentLock.all")) {
    return true
  }
  if (!user || !post) {
    return false
  }
  return !!(
    userCanDo(user,"posts.commentLock.own") &&
    userOwns(user, post)
  )
}

export const userIsBannedFromPost = (user: UsersMinimumInfo|DbUser, post: PermissionsPostMinimumInfo, postAuthor: PostModerationAuthor|DbUser|null): boolean => {
  if (!post) return false;
  return !!(
    post.bannedUserIds?.includes(user._id) &&
    postAuthor && userOwns(postAuthor, post)
  )
}

const userIsNotShortformOwner = (user: UsersCurrent|DbUser, post: PermissionsPostMinimumInfo): boolean => {
  return !!(
    post.shortform &&
    post.userId &&
    post.userId !== user._id
  )
}

export const userIsBannedFromAllPosts = (user: UsersCurrent|DbUser, post: PermissionsPostMinimumInfo, postAuthor: PostModerationAuthor|DbUser|null): boolean => {
  return !!(
    postAuthor?.bannedUserIds?.includes(user._id) &&
    userCanDo(postAuthor, 'posts.moderate.own') &&
    postAuthor && userOwns(postAuthor, post)
  )
}

export const userIsBannedFromAllPersonalPosts = (user: UsersCurrent|DbUser, post: PermissionsPostMinimumInfo, postAuthor: PostModerationAuthor|DbUser|null): boolean => {
  return !!(
    postAuthor?.bannedPersonalUserIds?.includes(user._id) &&
    userCanDo(postAuthor, 'posts.moderate.own.personal') &&
    postAuthor && userOwns(postAuthor, post)
  )
}

const getAuthorCommentBanReason = (user: UsersCurrent|DbUser, post: PermissionsPostMinimumInfo|null, postAuthor: PostModerationAuthor|DbUser|null): AuthorCommentBanReason | null => {
  if (!post) return null;
  if (userIsBannedFromPost(user, post, postAuthor)) {
    return "post";
  }
  if (userIsBannedFromAllPosts(user, post, postAuthor)) {
    return "allPosts";
  }
  if (userIsBannedFromAllPersonalPosts(user, post, postAuthor) && !post.frontpageDate) {
    return "allPersonalPosts";
  }
  return null;
}

type CommentingPermission =
  | { canComment: true, reason: null }
  | { canComment: false, reason: string };

export const userIsAllowedToComment = (user: UsersCurrent|DbUser|null, post: PermissionsPostMinimumInfo|null, postAuthor: PostModerationAuthor|DbUser|null, isReply: boolean): CommentingPermission => {
  if (!user) {
    return { canComment: false, reason: "You must be logged in to comment." };
  }
  if (user.deleted) {
    return { canComment: false, reason: "You can't comment because your account has been deleted." };
  }
  if (user.allCommentingDisabled) {
    return { canComment: false, reason: "Commenting has been disabled for your account." };
  }

  // this has to check for post.userId because that isn't consisently provided to CommentsNewForm components, which resulted in users failing to be able to comment on their own shortform post
  if (user.commentingOnOtherUsersDisabled && post?.userId && (post.userId !== user._id)) {
    return { canComment: false, reason: "Commenting on other users' posts has been disabled for your account." };
  }

  if (!post) {
    return { canComment: true, reason: null };
  }
  if (!isReply && userIsNotShortformOwner(user, post)) {
    return { canComment: false, reason: "Only the owner of a Quick Take's container can leave top-level comments on it." };
  }
  if (post.commentsLocked) {
    return { canComment: false, reason: "Comments on this post are disabled." };
  }
  if (post.rejected) {
    return { canComment: false, reason: "Comments on this post are disabled because it was rejected." };
  }

  const lockDate = maybeDate(post.commentsLockedToAccountsCreatedAfter)
  const userCreatedDate = maybeDate(user.createdAt);
  if (lockDate && lockDate < userCreatedDate) {
    const formattedLockDate = moment.utc(lockDate).format("MMMM D, YYYY");
    return { canComment: false, reason: `Comments on this post are disabled for accounts created after ${formattedLockDate}.` };
  }

  const authorBanReason = getAuthorCommentBanReason(user, post, postAuthor);
  if (authorBanReason) {
    return { canComment: false, reason: getAuthorCommentBanMessage(authorBanReason) };
  }
  return { canComment: true, reason: null };
}

// Return true if the user's account has at least one verified email address.
export const userEmailAddressIsVerified = (user: UsersCurrent|DbUser|null): boolean => {
  if (!user || !user.emails)
    return false;
  for (let email of user.emails) {
    if (email && email.verified)
      return true;
  }
  return false;
};

export const userHasEmailAddress = (user: UsersCurrent|DbUser|null): boolean => {
  return !!(user?.emails && user.emails.length > 0) || !!user?.email;
}

type UserMaybeWithEmail = {
  email?: string | null
  emails?: UsersCurrent["emails"] | null
}

export function getUserEmail (user: UserMaybeWithEmail|null): string | undefined {
  return user?.emails?.[0]?.address ?? user?.email ?? undefined
}

// Replaces Users.getProfileUrl from the vulcan-users package.
export const userGetProfileUrl = (user: DbUser|UsersMinimumInfo|SearchUser|UsersMapEntry|null): string => {
  if (!user) return "";
  
  if (user.slug) {
    return userGetProfileUrlFromSlug(user.slug);
  } else {
    return "";
  }
}

export const userGetProfileUrlFromSlug = (userSlug: string): string => {
  if (!userSlug) return "";
  
  return `/users/${userSlug}`;
}

export const userGetAnalyticsUrl = (user: {slug: string}): string => {
  if (!user) return "";

  if (user.slug) {
    return `${userGetProfileUrlFromSlug(user.slug)}/stats`;
  } else {
    return "";
  }
}


export const userGetAbsoluteProfileUrl = (user: DbUser|UsersMinimumInfo|SearchUser|UsersMapEntry|null, forumType: ForumTypeString): string => {
  const relativeUrl = userGetProfileUrl(user);
  return relativeUrl ? getSiteUrl(forumType).slice(0, -1) + relativeUrl : "";
};

export const userGetAbsoluteProfileUrlFromSlug = (userSlug: string, forumType: ForumTypeString): string => {
  const relativeUrl = userGetProfileUrlFromSlug(userSlug);
  return relativeUrl ? getSiteUrl(forumType).slice(0, -1) + relativeUrl : "";
};

export const userGetAbsoluteAnalyticsUrl = (user: {slug: string}, forumType: ForumTypeString): string => {
  const relativeUrl = userGetAnalyticsUrl(user);
  return relativeUrl ? getSiteUrl(forumType).slice(0, -1) + relativeUrl : "";
};

export const userUseMarkdownPostEditor = (user: UsersCurrent|DbUser|null): boolean => {
  if (!user) {
    return false;
  }
  return user.markDownPostEditor
}

export const userCanEditUser = (currentUser: UsersCurrent|DbUser|null, user: HasIdType|HasSlugType|UsersMinimumInfo|DbUser) => {
  // We allow users to call this function with basically "pretend" user objects
  // as the second argument. We know from inspecting userOwns that those pretend
  // user objects are safe, but if userOwns allowed them it would make the type
  // checks much less safe.
  return userOwns(currentUser, user as UsersMinimumInfo|DbUser) || userCanDo(currentUser, 'users.edit.all')
}

export const userCanSeeAdminSettingsTab = (user: UsersCurrent|DbUser|null): boolean => {
  return userIsAdmin(user) || userIsMemberOf(user, 'realAdmins') || userIsMemberOf(user, 'alignmentForumAdmins');
}

interface UserLocation {
  lat: number,
  lng: number,
  loading: boolean,
  known: boolean,
}

// Return the current user's location, as a latitude-longitude pair, plus the boolean field `known`.
// If `known` is false, the lat/lng are invalid placeholders.
// If the user is logged in, we try to return the location specified in their account settings.
export const userGetLocation = (currentUser: UsersCurrent|DbUser|null): {
  lat: number,
  lng: number,
  known: boolean
} => {
  const placeholderLat = 37.871853;
  const placeholderLng = -122.258423;

  const currentUserLat = currentUser && currentUser.mongoLocation && currentUser.mongoLocation.coordinates[1]
  const currentUserLng = currentUser && currentUser.mongoLocation && currentUser.mongoLocation.coordinates[0]

  if (currentUserLat && currentUserLng) {
    return {lat: currentUserLat, lng: currentUserLng, known: true}
  }
  return {lat: placeholderLat, lng: placeholderLng, known: false}
}

export const userGetPostCount = (user: UsersMinimumInfo|DbUser, forumType: ForumTypeString): number => {
  if (forumType === 'AlignmentForum') {
    return user.afPostCount;
  } else {
    return user.postCount;
  }
}

export const userGetCommentCount = (user: UsersMinimumInfo|DbUser, forumType: ForumTypeString): number => {
  if (forumType === 'AlignmentForum') {
    return user.afCommentCount;
  } else {
    return user.commentCount;
  }
}

export const isMod = (user: UsersProfile|UsersCurrent|DbUser): boolean => {
  return (user.isAdmin || user.groups?.includes('sunshineRegiment')) ?? false
}

const SHOW_NEW_USER_GUIDELINES_AFTER = new Date('10-07-2022');
export const requireNewUserGuidelinesAck = (user: UsersCurrent, forumType: ForumTypeString) => {
  if (isE2E) return false;
  
  if (forumType !== 'LessWrong') return false;

  const userCreatedAfterCutoff = user.createdAt
    ? new Date(user.createdAt) > SHOW_NEW_USER_GUIDELINES_AFTER
    : false;

  return !user.acknowledgedNewUserGuidelines && userCreatedAfterCutoff;
};

export const getSignature = (name: string) => {
  const today = new Date();
  const todayString = today.toLocaleString('default', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles'});
  return `${todayString}, ${name}`;
};

export const getSignatureWithNote = (name: string, note: string) => {
  return `${getSignature(name)}: ${note}\n`;
};

export const SOCIAL_MEDIA_PROFILE_FIELDS = {
  linkedinProfileURL: 'linkedin.com/in/',
  facebookProfileURL: 'facebook.com/',
  blueskyProfileURL: 'bsky.app/profile/',
  twitterProfileURL: 'twitter.com/',
  githubProfileURL: 'github.com/'
}
export type SocialMediaProfileField = keyof typeof SOCIAL_MEDIA_PROFILE_FIELDS;

export const profileFieldToSocialMediaHref = (
  field: SocialMediaProfileField,
  userUrl: string,
) => `https://${combineUrls(SOCIAL_MEDIA_PROFILE_FIELDS[field], userUrl)}`;

export const socialMediaSiteNameToHref = (
  siteName: SocialMediaSiteName | "website",
  userUrl: string,
) => siteName === "website"
  ? `https://${userUrl}`
  : profileFieldToSocialMediaHref(`${siteName}ProfileURL`, userUrl);

export const userShortformPostTitle = (user: Pick<DbUser, "displayName">) => {
  const shortformName = "Shortform";

  // Emoji's aren't allowed in post titles, see `assertPostTitleHasNoEmojis`
  const displayNameWithoutEmojis = user.displayName?.replace(/\p{Extended_Pictographic}/gu, '');
  return `${displayNameWithoutEmojis}'s ${shortformName}`;
}

export const userCanPost = (user: UsersCurrent|DbUser) => {
  if (user.deleted) return false;
  if (user.postingDisabled) return false
  return userCanDo(user, 'posts.new')
}

export const karmaChangeUpdateFrequencies = new TupleSet(["disabled", "daily", "weekly", "realtime"] as const);

export type KarmaChangeUpdateFrequency = UnionOf<typeof karmaChangeUpdateFrequencies>;

export interface KarmaChangeSettingsType {
  updateFrequency: KarmaChangeUpdateFrequency;
  /**
   * Time of day at which daily/weekly batched updates are released. A number of hours [0,24), always in GMT.
   */
  timeOfDayGMT: number;
  dayOfWeekGMT: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  showNegativeKarma: boolean;
}

export const karmaChangeNotifierDefaultSettings = new DeferredForumSelect<KarmaChangeSettingsType>({
  EAForum: {
    updateFrequency: "realtime",
    timeOfDayGMT: 11, // 3am PST
    dayOfWeekGMT: "Saturday",
    showNegativeKarma: false,
  },
  default: {
    updateFrequency: "daily",
    timeOfDayGMT: 11,
    dayOfWeekGMT: "Saturday",
    showNegativeKarma: false,
  },
} as const);

type UserInputDateFields = KeysOfType<UpdateUserDataInput, Date | null | undefined>;

export type EditableUser = Omit<UpdateUserDataInput & Omit<UsersEdit, UserInputDateFields>, 'howOthersCanHelpMe' | 'howICanHelpOthers' | 'legacyData'> & {
  _id: string;
};

type ff = EditableUser['banned']

export const CAREER_STAGES: CareerStage[] = [
  { value: "highSchool", label: "In high school", icon: "School", EAGLabel: "Student (high school)" },
  {
    value: "associateDegree",
    label: "Pursuing an associate's degree",
    icon: "School",
    EAGLabel: "Pursuing an associates degree",
  },
  {
    value: "undergradDegree",
    label: "Pursuing an undergraduate degree",
    icon: "School",
    EAGLabel: "Pursuing an undergraduate degree",
  },
  {
    value: "professionalDegree",
    label: "Pursuing a professional degree",
    icon: "School",
    EAGLabel: "Pursuing a professional degree",
  },
  {
    value: "graduateDegree",
    label: "Pursuing a graduate degree (e.g. Master's)",
    icon: "School",
    EAGLabel: "Pursuing a graduate degree (e.g. Masters)",
  },
  {
    value: "doctoralDegree",
    label: "Pursuing a doctoral degree (e.g. PhD)",
    icon: "School",
    EAGLabel: "Pursuing a doctoral degree (e.g. PhD)",
  },
  {
    value: "otherDegree",
    label: "Pursuing other degree/diploma",
    icon: "School",
    EAGLabel: "Pursuing other degree/diploma",
  },
  { value: "earlyCareer", label: "Working (0-5 years)", icon: "Work", EAGLabel: "Working (0-5 years of experience)" },
  { value: "midCareer", label: "Working (6-15 years)", icon: "Work", EAGLabel: "Working (6-15 years of experience)" },
  { value: "lateCareer", label: "Working (15+ years)", icon: "Work", EAGLabel: "Working (6-15 years of experience)" },
  { value: "seekingWork", label: "Seeking work", icon: "Work", EAGLabel: "Not employed, but looking" },
  { value: "retired", label: "Retired", icon: "Work", EAGLabel: "Retired" },
];

export const PROGRAM_PARTICIPATION = [
  { value: "vpIntro", label: "Completed the Introductory EA Virtual Program" },
  { value: "vpInDepth", label: "Completed the In-Depth EA Virtual Program" },
  { value: "vpPrecipice", label: "Completed the Precipice Reading Group" },
  { value: "vpLegal", label: "Completed the Legal Topics in EA Virtual Program" },
  { value: "vpAltProtein", label: "Completed the Alt Protein Fundamentals Virtual Program" },
  { value: "vpAGISafety", label: "Completed the AGI Safety Fundamentals Virtual Program" },
  { value: "vpMLSafety", label: "Completed the ML Safety Scholars Virtual Program" },
  { value: "eag", label: "Attended an EA Global conference" },
  { value: "eagx", label: "Attended an EAGx conference" },
  { value: "localgroup", label: "Attended more than three meetings with a local EA group" },
  { value: "80k", label: "Received career coaching from 80,000 Hours" },
];

export type CareerStageValue =
  "highSchool" |
  "associateDegree" |
  "undergradDegree" |
  "professionalDegree" |
  "graduateDegree" |
  "doctoralDegree" |
  "otherDegree" |
  "earlyCareer" |
  "midCareer" |
  "lateCareer" |
  "seekingWork" |
  "retired";

// list of career stage options from EAG
type EAGCareerStage = "Student (high school)" |
  "Pursuing an associates degree" |
  "Pursuing an undergraduate degree" |
  "Pursuing a professional degree" |
  "Pursuing a graduate degree (e.g. Masters)" |
  "Pursuing a doctoral degree (e.g. PhD)" |
  "Pursuing other degree/diploma" |
  "Working (0-5 years of experience)" |
  "Working (6-15 years of experience)" |
  "Working (15+ years of experience)" |
  "Not employed, but looking" |
  "Retired";

export type CareerStage = {
  value: CareerStageValue;
  label: string;
  icon: ForumIconName;
  EAGLabel: EAGCareerStage;
};

export const MULTISELECT_SUGGESTION_LIMIT = 8;
