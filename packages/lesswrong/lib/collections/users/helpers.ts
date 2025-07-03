import {forumTypeSetting, isEAForum, verifyEmailsSetting} from '../../instanceSettings'
import { combineUrls, getSiteUrl } from '../../vulcan-lib/utils';
import { userOwns, userCanDo, userIsMemberOf, PermissionableUser } from '../../vulcan-users/permissions';
import * as _ from 'underscore';
import type { PermissionResult } from '../../make_voteable';
import { newUserIconKarmaThresholdSetting } from '@/lib/instanceSettings';
import { hasAuthorModeration } from '../../betas';
import { DeferredForumSelect } from '@/lib/forumTypeUtils';
import { TupleSet, UnionOf } from '@/lib/utils/typeGuardUtils';
import type { ForumIconName } from '@/components/common/ForumIcon';
import type { EditablePost } from '../posts/helpers';

export const ACCOUNT_DELETION_COOLING_OFF_DAYS = 14;

export const spamRiskScoreThreshold = 0.16 // Corresponds to recaptchaScore of 0.2

export type UserDisplayNameInfo = { username?: string | null, fullName?: string | null, displayName: string | null };

// Get a user's display name (not unique, can take special characters and spaces)
export const userGetDisplayName = (user: UserDisplayNameInfo | null): string => {
  if (!user) {
    return "";
  } else {
    return forumTypeSetting.get() === 'AlignmentForum' ? 
      (user.fullName || user.displayName) ?? "" :
      (user.displayName || getUserName(user)) ?? ""
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
export const isNewUser = (user: UsersMinimumInfo): boolean => {
  const oneYearInMs = 365*24*60*60*1000;
  const oneWeekInMs = 7*24*60*60*1000;
  const userCreatedAt = new Date(user.createdAt);

  const karmaThreshold = newUserIconKarmaThresholdSetting.get()
  const userKarma = user.karma;
  const userBelowKarmaThreshold = karmaThreshold && userKarma < karmaThreshold;

  // For the EA forum, return true if either:
  // 1. the user is below the karma threshold, or
  // 2. the user was created less than a week ago
  if (isEAForum) {
    return userBelowKarmaThreshold || userCreatedAt.getTime() > new Date().getTime() - oneWeekInMs;
  }

  // Elsewhere, only return true for a year after creation if the user remains below the karma threshold
  if (userBelowKarmaThreshold) {
    return userCreatedAt.getTime() > new Date().getTime() - oneYearInMs;
  }
  
  // But continue to return true for a week even if they pass the karma threshold
  return userCreatedAt.getTime() > new Date().getTime() - oneWeekInMs;
}

export interface SharableDocument {
  coauthorStatuses?: DbPost["coauthorStatuses"]
  shareWithUsers?: DbPost["shareWithUsers"] | null
  sharingSettings?: DbPost["sharingSettings"]
}

export const userIsSharedOn = (currentUser: DbUser|UsersMinimumInfo|null, document: SharableDocument): boolean => {
  if (!currentUser) return false;
  
  // Shared as a coauthor? Always give access
  const coauthorStatuses = document.coauthorStatuses ?? []
  if (coauthorStatuses.findIndex(({ userId }) => userId === currentUser._id) >= 0) return true
  
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

const postHasModerationGuidelines = (
  post: PostsBase | PostsModerationGuidelines | DbPost,
): boolean => {
  if (!hasAuthorModeration) {
    return false;
  }
  // Because of a bug in Vulcan that doesn't adequately deal with nested fields
  // in document validation, we check for originalContents instead of html here,
  // which causes some problems with empty strings, but should overall be fine
  return !!(
    ("moderationGuidelines_latest" in post && post.moderationGuidelines_latest) ||
    ("moderationGuidelines" in post && post.moderationGuidelines?.originalContents) ||
    post.moderationStyle
  );
}

export const userCanModeratePost = (
  user: UsersProfile|UsersCurrent|DbUser|null,
  post?: PostsBase|PostsModerationGuidelines|DbPost|null,
): boolean => {
  if (userCanDo(user,"posts.moderate.all")) {
    return true
  }
  if (!user || !post) {
    return false
  }
  // Users who can moderate their personal posts can moderate any post that
  // meets all of the following:
  //  1) they own
  //  2) has moderation guidelins
  //  3) is not on the frontpage
  if (
    userCanDo(user, "posts.moderate.own.personal") &&
    userOwns(user, post) &&
    postHasModerationGuidelines(post) &&
    !post.frontpageDate
  ) {
    return true
  }
  // Users who can moderate all of their own posts (even those on the frontpage)
  // can moderate any post that meets all of the following:
  //  1) they own
  //  2) has moderation guidelines
  // We have now checked all the possible conditions for posting, if they fail
  // this, check they cannot moderate this post
  return !!(
    userCanDo(user,"posts.moderate.own") &&
    userOwns(user, post) &&
    postHasModerationGuidelines(post)
  )
}

export const userCanModerateComment = (user: UsersProfile|UsersCurrent|DbUser|null, post: PostsBase|DbPost|null , tag: TagBasicInfo|DbTag|null, comment: CommentsList|DbComment) => {
  if (!user || !comment) {
    return false;
  }
  if (post) {
    if (userCanModeratePost(user, post)) return true 
    if (userOwns(user, comment) && !comment.directChildrenCount) return true 
    return false
  } else if (tag) {
    if (userIsMemberOf(user, "sunshineRegiment")) {
      return true;
    } else if (userOwns(user, comment) && !comment.directChildrenCount) {
      return true 
    } else {
      return false
    }
  } else {
    return false
  }
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

export const userIsBannedFromPost = (user: UsersMinimumInfo|DbUser, post: PostsDetails|DbPost, postAuthor: PermissionableUser|DbUser|null): boolean => {
  if (!post) return false;
  return !!(
    post.bannedUserIds?.includes(user._id) &&
    postAuthor && userOwns(postAuthor, post)
  )
}

export const userIsNotShortformOwner = (user: UsersCurrent|DbUser, post: PostsDetails|DbPost): boolean => {
  return !!(
    post.shortform &&
    post.userId &&
    post.userId !== user._id
  )
}

export const userIsBannedFromAllPosts = (user: UsersCurrent|DbUser, post: PostsDetails|DbPost, postAuthor: PermissionableUser|DbUser|null): boolean => {
  return !!(
    // @ts-ignore FIXME: Not enforcing that the fragment includes bannedUserIds
    postAuthor?.bannedUserIds?.includes(user._id) &&
    // @ts-ignore FIXME: Not enforcing that the fragment includes user.groups
    userCanDo(postAuthor, 'posts.moderate.own') &&
    postAuthor && userOwns(postAuthor, post)
  )
}

export const userIsBannedFromAllPersonalPosts = (user: UsersCurrent|DbUser, post: PostsDetails|DbPost, postAuthor: PermissionableUser|DbUser|null): boolean => {
  return !!(
    // @ts-ignore FIXME: Not enforcing that the fragment includes bannedUserIds
    postAuthor?.bannedPersonalUserIds?.includes(user._id) &&
    // @ts-ignore FIXME: Not enforcing that the fragment includes user.groups
    userCanDo(postAuthor, 'posts.moderate.own.personal') &&
    postAuthor && userOwns(postAuthor, post)
  )
}

export const userIsAllowedToComment = (user: UsersCurrent|DbUser|null, post: PostsDetails|DbPost|null, postAuthor: PermissionableUser|DbUser|null, isReply: boolean): boolean => {
  if (!user) return false
  if (user.deleted) return false
  if (user.allCommentingDisabled) return false

  // this has to check for post.userId because that isn't consisently provided to CommentsNewForm components, which resulted in users failing to be able to comment on their own shortform post
  if (user.commentingOnOtherUsersDisabled && post?.userId && (post.userId !== user._id))
    return false

  if (post) {
    if (post.shortform && post.userId && post.userId !== user._id && !isReply) {
      return false;
    }

    if (post.commentsLocked) {
      return false
    }
    if (post.rejected) {
      return false
    }
    if ((post.commentsLockedToAccountsCreatedAfter ?? new Date()) < user.createdAt) {
      return false
    }
  
    if (userIsBannedFromPost(user, post, postAuthor)) {
      return false
    }
  
    if (userIsBannedFromAllPosts(user, post, postAuthor)) {
      return false
    }
  
    if (userIsBannedFromAllPersonalPosts(user, post, postAuthor) && !post.frontpageDate) {
      return false
    }
  }

  return true
}

// Return true if the user's account has at least one verified email address.
export const userEmailAddressIsVerified = (user: UsersCurrent|DbUser|null): boolean => {
  // Some forums don't do their own email verification
  if (!verifyEmailsSetting.get()) {
    return true
  }

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
export const userGetProfileUrl = (user: DbUser|UsersMinimumInfo|SearchUser|UsersMapEntry|null, isAbsolute=false): string => {
  if (!user) return "";
  
  if (user.slug) {
    return userGetProfileUrlFromSlug(user.slug, isAbsolute);
  } else {
    return "";
  }
}

export const userGetProfileUrlFromSlug = (userSlug: string, isAbsolute=false): string => {
  if (!userSlug) return "";
  
  const prefix = isAbsolute ? getSiteUrl().slice(0,-1) : '';
  return `${prefix}/users/${userSlug}`;
}

export const userGetAnalyticsUrl = (user: {slug: string}, isAbsolute=false): string => {
  if (!user) return "";

  if (user.slug) {
    return `${userGetProfileUrlFromSlug(user.slug, isAbsolute)}/stats`;
  } else {
    return "";
  }
}


export const userUseMarkdownPostEditor = (user: UsersCurrent|null): boolean => {
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

export const userGetPostCount = (user: UsersMinimumInfo|DbUser): number => {
  if (forumTypeSetting.get() === 'AlignmentForum') {
    return user.afPostCount;
  } else {
    return user.postCount;
  }
}

export const userGetCommentCount = (user: UsersMinimumInfo|DbUser): number => {
  if (forumTypeSetting.get() === 'AlignmentForum') {
    return user.afCommentCount;
  } else {
    return user.commentCount;
  }
}

export const isMod = (user: UsersProfile|UsersCurrent|DbUser): boolean => {
  return (user.isAdmin || user.groups?.includes('sunshineRegiment')) ?? false
}

/**
 * @returns "auth0" | "google-oauth2" | "facebook" | null
 */
export const getAuth0Provider = (user: DbUser): string | null => {
  return user.services?.auth0?.provider;
}

export const getAuth0Id = (user: DbUser) => {
  const auth0 = user.services?.auth0;
  if (auth0) {
    const id = auth0.id ?? auth0.user_id;
    if (id) {
      return id;
    }
  }
  throw new Error("User does not have an Auth0 user ID");
}

const SHOW_NEW_USER_GUIDELINES_AFTER = new Date('10-07-2022');
export const requireNewUserGuidelinesAck = (user: UsersCurrent) => {
  if (forumTypeSetting.get() !== 'LessWrong') return false;

  const userCreatedAfterCutoff = user.createdAt
    ? new Date(user.createdAt) > SHOW_NEW_USER_GUIDELINES_AFTER
    : false;

  return !user.acknowledgedNewUserGuidelines && userCreatedAfterCutoff;
};

export const getSignature = (name: string) => {
  const today = new Date();
  const todayString = today.toLocaleString('default', { month: 'short', day: 'numeric'});
  return `${todayString}, ${name}`;
};

export const getSignatureWithNote = (name: string, note: string) => {
  return `${getSignature(name)}: ${note}\n`;
};

export async function appendToSunshineNotes({moderatedUserId, adminName, text, context}: {
  moderatedUserId: string,
  adminName: string,
  text: string,
  context: ResolverContext,
}): Promise<void> {
  const moderatedUser = await context.Users.findOne({_id: moderatedUserId});
  if (!moderatedUser) throw "Invalid userId in appendToSunshineNotes";
  const newNote = getSignatureWithNote(adminName, text);
  const oldNotes = moderatedUser.sunshineNotes ?? "";
  const updatedNotes = `${newNote}${oldNotes}`;
  await context.Users.rawUpdateOne({_id: moderatedUserId}, {$set: {sunshineNotes: updatedNotes}});
}

/**
 * At one point, we disabled voting for users with less than 1 karma
 * Keeping this function and its uses around will make it easier to do that kind of thing in the future
 */
export const voteButtonsDisabledForUser = (user: UsersMinimumInfo|DbUser|null): PermissionResult => {
  return { fail: false };
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
  const shortformName = isEAForum ? "Quick takes" : "Shortform";

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
  hasAuth0Id?: boolean | null;
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

