import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LATEST_REVISION_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import SimpleSchema from "simpl-schema";
import {
  userGetProfileUrl,
  getUserEmail,
  userOwnsAndInGroup, getAuth0Provider,
  SOCIAL_MEDIA_PROFILE_FIELDS,
  karmaChangeUpdateFrequencies,
} from "./helpers";
import { userGetEditUrl } from "../../vulcan-users/helpers";
import { getAllUserGroups, userOwns, userIsAdmin, userHasntChangedName } from "../../vulcan-users/permissions";
import { formGroups } from "./formGroups";
import * as _ from "underscore";
import {
  hasEventsSetting,
  isAF,
  isEAForum, isLW, isLWorAF,
  taggingNamePluralSetting,
  verifyEmailsSetting
} from "../../instanceSettings";
import {
  accessFilterMultiple, arrayOfForeignKeysOnCreate, generateIdResolverMulti,
  generateIdResolverSingle,
  getDenormalizedCountOfReferencesGetValue,
  getDenormalizedFieldOnCreate,
  getDenormalizedFieldOnUpdate,
  googleLocationToMongoLocation,
} from "../../utils/schemaUtils";
import { postStatuses } from "../posts/constants";
import { REVIEW_NAME_IN_SITU, REVIEW_YEAR } from "../../reviewUtils";
import uniqBy from "lodash/uniqBy";
import { userThemeSettings } from "../../../themes/themeNames";
import type { ForumIconName } from "../../../components/common/ForumIcon";
import { getCommentViewOptions } from "../../commentViewOptions";
import {
  allowSubscribeToSequencePosts,
  hasAccountDeletionFlow,
  hasAuthorModeration,
  hasPostRecommendations,
  hasSurveys,
  userCanViewJargonTerms
} from "../../betas";
import { randomId } from "../../random";
import { getUserABTestKey } from "../../abTestImpl";
import { getNestedProperty } from "../../vulcan-lib/utils";
import { defaultEditorPlaceholder, getDefaultLocalStorageIdGenerator, getDenormalizedEditableResolver, RevisionStorageType } from "@/lib/editor/make_editable";
import { recommendationSettingsSchema } from "@/lib/collections/users/recommendationSettings";
import { markdownToHtml, dataToMarkdown } from "@/server/editor/conversionUtils";
import { getKarmaChangeDateRange, getKarmaChangeNextBatchDate, getKarmaChanges } from "@/server/karmaChanges";
import { rateLimitDateWhenUserNextAbleToComment, rateLimitDateWhenUserNextAbleToPost, getRecentKarmaInfo } from "@/server/rateLimitUtils";
import { isFriendlyUI } from "@/themes/forumTheme";
import GraphQLJSON from "graphql-type-json";
import { TupleSet, UnionOf } from "@/lib/utils/typeGuardUtils";
import gql from "graphql-tag";

///////////////////////////////////////
// Order for the Schema is as follows. Change as you see fit:
// 00.
// 10. Display Name
// 20. Email
// 30. Bio
// 40. Slug
// 50. Website
// 60. Twitter username
// 70.
// 80.
// 90.
// 100.
// Anything else..
///////////////////////////////////////

export const createDisplayName = (user: Partial<DbInsertion<DbUser>> | CreateUserDataInput | UpdateUserDataInput): string => {
  const profileName = getNestedProperty(user, "profile.name");
  const twitterName = getNestedProperty(user, "services.twitter.screenName");
  const linkedinFirstName = getNestedProperty(user, "services.linkedin.firstName");
  const email = getUserEmail(user);
  if (profileName) return profileName;
  if (twitterName) return twitterName;
  if (linkedinFirstName) return `${linkedinFirstName} ${getNestedProperty(user, "services.linkedin.lastName")}`;
  if (user.username) return user.username;
  if (email) return email.slice(0, email.indexOf("@"));
  return "[missing username]";
};

const adminGroup = {
  name: "admin",
  order: 100,
  label: "Admin",
};

const ownsOrIsAdmin = (user: DbUser | null, document: any) => {
  return userOwns(user, document) || userIsAdmin(user);
};

const ownsOrIsMod = (user: DbUser | null, document: any) => {
  return userOwns(user, document) || userIsAdmin(user) || (user?.groups?.includes("sunshineRegiment") ?? false);
};

export const REACT_PALETTE_STYLES = ["listView", "gridView"];

export const MAX_NOTIFICATION_RADIUS = 300;

export type NotificationChannel = "onsite" | "email";

const NOTIFICATION_BATCHING_FREQUENCIES = new TupleSet([
  "realtime",
  "daily",
  "weekly",
] as const);
export type NotificationBatchingFrequency = UnionOf<typeof NOTIFICATION_BATCHING_FREQUENCIES>;

const DAYS_OF_WEEK = new TupleSet(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const);
export type DayOfWeek = UnionOf<typeof DAYS_OF_WEEK>;

export type NotificationChannelSettings = {
  enabled: boolean,
  /**
   * Frequency at which we send batched notifications. When enabled is false, this doesn't apply, but is persisted
   * so the user can restore their old settings
   */
  batchingFrequency: NotificationBatchingFrequency,
  /** Time of day at which daily/weekly batched updates are released. A number of hours [0,24), always in GMT. */
  timeOfDayGMT: number,
  /** Day of week at which weekly updates are released, always in GMT */
  dayOfWeekGMT: DayOfWeek
}

const notificationChannelSettingsSchema = new SimpleSchema({
  enabled: {
    type: Boolean,
  },
  batchingFrequency: {
    type: String,
    allowedValues: Array.from(NOTIFICATION_BATCHING_FREQUENCIES),
  },
  timeOfDayGMT: {
    type: SimpleSchema.Integer,
    min: 0,
    max: 23
  },
  dayOfWeekGMT: {
    type: String,
    allowedValues: Array.from(DAYS_OF_WEEK)
  },
})

export type NotificationTypeSettings = Record<NotificationChannel, NotificationChannelSettings>

const notificationTypeSettingsSchema = new SimpleSchema({
  onsite: {
    type: notificationChannelSettingsSchema,
  },
  email: {
    type: notificationChannelSettingsSchema,
  },
});

export const defaultNotificationTypeSettings: NotificationTypeSettings = {
  onsite: {
    enabled: true,
    batchingFrequency: "realtime",
    timeOfDayGMT: 12,
    dayOfWeekGMT: "Monday",
  },
  email: {
    enabled: false,
    batchingFrequency: "realtime",
    timeOfDayGMT: 12,
    dayOfWeekGMT: "Monday",
  }
};

const bothChannelsEnabledNotificationTypeSettings: NotificationTypeSettings = {
  onsite: {
    enabled: true,
    batchingFrequency: "realtime",
    timeOfDayGMT: 12,
    dayOfWeekGMT: "Monday",
  },
  email: {
    enabled: true,
    batchingFrequency: "realtime",
    timeOfDayGMT: 12,
    dayOfWeekGMT: "Monday",
  }
};


///////////////////////////////////////////////
// Migration of NotificationTypeSettings     //
//                                           //
// This section is here to support migrating //
// NotificationTypeSettings to a new format, //
// and will be deleted shortly               //
///////////////////////////////////////////////

export type LegacyNotificationTypeSettings = {
  channel: "none" | "onsite" | "email" | "both";
  batchingFrequency: "realtime" | "daily" | "weekly";
  timeOfDayGMT: number; // 0 to 23
  dayOfWeekGMT: DayOfWeek;
};


export const legacyDefaultNotificationTypeSettings: LegacyNotificationTypeSettings = {
  channel: "onsite",
  batchingFrequency: "realtime",
  timeOfDayGMT: 12,
  dayOfWeekGMT: "Monday",
};

const legacyBothChannelNotificationTypeSettings: LegacyNotificationTypeSettings = {
  channel: "both",
  batchingFrequency: "realtime",
  timeOfDayGMT: 12,
  dayOfWeekGMT: "Monday",
};

export function isNewNotificationTypeSettings(value: AnyBecauseIsInput): value is NotificationTypeSettings {
  return (
    typeof value === 'object' &&
    value !== null &&
    'onsite' in value &&
    'email' in value &&
    typeof value.onsite === 'object' &&
    typeof value.email === 'object' &&
    'batchingFrequency' in value.onsite &&
    'timeOfDayGMT' in value.onsite &&
    'dayOfWeekGMT' in value.onsite
  );
}

export function legacyToNewNotificationTypeSettings(notificationSettings: LegacyNotificationTypeSettings | NotificationTypeSettings | null): NotificationTypeSettings {
  if (!notificationSettings) return defaultNotificationTypeSettings;
  if (isNewNotificationTypeSettings(notificationSettings)) return notificationSettings

  const { channel, batchingFrequency, timeOfDayGMT, dayOfWeekGMT } = notificationSettings;

  const onsiteEnabled = (channel === "both" || channel === "onsite");
  const emailEnabled = (channel === "both" || channel === "email");

  return {
    onsite: {
      enabled: onsiteEnabled,
      batchingFrequency,
      timeOfDayGMT,
      dayOfWeekGMT,
    },
    email: {
      enabled: emailEnabled,
      batchingFrequency,
      timeOfDayGMT,
      dayOfWeekGMT,
    },
  };
};

export function isLegacyNotificationTypeSettings(value: AnyBecauseIsInput): value is LegacyNotificationTypeSettings {
  return (
    typeof value === 'object' &&
    value !== null &&
    'channel' in value &&
    'batchingFrequency' in value &&
    'timeOfDayGMT' in value &&
    'dayOfWeekGMT' in value
  );
}

export function newToLegacyNotificationTypeSettings(newFormat: LegacyNotificationTypeSettings | NotificationTypeSettings | null): LegacyNotificationTypeSettings {
  if (!newFormat) return legacyDefaultNotificationTypeSettings;
  if (isLegacyNotificationTypeSettings(newFormat)) return newFormat;

  const { onsite, email } = newFormat;

  let channel: "none" | "onsite" | "email" | "both" = "none";
  if (onsite.enabled && email.enabled) {
    channel = "both";
  } else if (onsite.enabled) {
    channel = "onsite";
  } else if (email.enabled) {
    channel = "email";
  }

  // Not a one-to-one mapping here because the old format doesn't support different settings for each channel
  // when both are enabled. If this is the case, choose the faster frequency for both
  let batchingFrequency: NotificationBatchingFrequency = legacyDefaultNotificationTypeSettings.batchingFrequency;
  if (channel === "both") {
    const frequencies = [onsite.batchingFrequency, email.batchingFrequency];
    if (frequencies.includes("realtime")) {
      batchingFrequency = "realtime";
    } else if (frequencies.includes("daily")) {
      batchingFrequency = "daily";
    } else {
      batchingFrequency = "weekly";
    }
  } else {
    batchingFrequency = channel === "onsite" ? onsite.batchingFrequency : email.batchingFrequency;
  }

  // Use onsite settings as the default for time and day, assuming they are the same for both
  return {
    channel,
    batchingFrequency,
    timeOfDayGMT: onsite.timeOfDayGMT,
    dayOfWeekGMT: onsite.dayOfWeekGMT,
  };
}

const DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS = {
  outputType: "JSON",
  canRead: [userOwns, "admins"],
  canUpdate: [userOwns, "admins"],
  canCreate: ["members", "admins"],
  validation: {
    simpleSchema: notificationTypeSettingsSchema,
    optional: true,

    // TODO: remove this once migration is complete
    blackbox: true,
  },
} satisfies GraphQLFieldSpecification<"Users">;

const dailyEmailBatchNotificationSettingOnCreate = {
  onsite: defaultNotificationTypeSettings.onsite,
  email: { ...defaultNotificationTypeSettings.email, enabled: true, batchingFrequency: "daily" },
};

const emailEnabledNotificationSettingOnCreate = {
  onsite: defaultNotificationTypeSettings.onsite,
  email: { ...defaultNotificationTypeSettings.email, enabled: true },
};

///////////////////////////////////////////////
// End migration of NotificationTypeSettings //
///////////////////////////////////////////////

const karmaChangeSettingsType = new SimpleSchema({
  updateFrequency: {
    type: String,
    optional: true,
    allowedValues: Array.from(karmaChangeUpdateFrequencies),
  },
  timeOfDayGMT: {
    type: SimpleSchema.Integer,
    optional: true,
    min: 0,
    max: 23,
  },
  dayOfWeekGMT: {
    type: String,
    optional: true,
    allowedValues: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  },
  showNegativeKarma: {
    type: Boolean,
    optional: true,
  },
});

const expandedFrontpageSectionsSettings = new SimpleSchema({
  community: { type: Boolean, optional: true, nullable: true },
  recommendations: { type: Boolean, optional: true, nullable: true },
  quickTakes: { type: Boolean, optional: true, nullable: true },
  quickTakesCommunity: { type: Boolean, optional: true, nullable: true },
  popularComments: { type: Boolean, optional: true, nullable: true },
});


const partiallyReadSequenceItem = new SimpleSchema({
  sequenceId: {
    type: String,
    foreignKey: "Sequences",
    optional: true,
  },
  collectionId: {
    type: String,
    foreignKey: "Collections",
    optional: true,
  },
  lastReadPostId: {
    type: String,
    foreignKey: "Posts",
  },
  nextPostId: {
    type: String,
    foreignKey: "Posts",
  },
  numRead: {
    type: SimpleSchema.Integer,
  },
  numTotal: {
    type: SimpleSchema.Integer,
  },
  lastReadTime: {
    type: Date,
    optional: true,
  },
});

const userTheme = new SimpleSchema({
  name: {
    type: String,
    allowedValues: [...userThemeSettings],
    optional: true,
    nullable: true,
  },
  siteThemeOverride: {
    type: Object,
    optional: true,
    nullable: true,
    blackbox: true,
  },
});

export type CareerStageValue =
  | "highSchool"
  | "associateDegree"
  | "undergradDegree"
  | "professionalDegree"
  | "graduateDegree"
  | "doctoralDegree"
  | "otherDegree"
  | "earlyCareer"
  | "midCareer"
  | "lateCareer"
  | "seekingWork"
  | "retired";

// list of career stage options from EAG
type EAGCareerStage =
  | "Student (high school)"
  | "Pursuing an associates degree"
  | "Pursuing an undergraduate degree"
  | "Pursuing a professional degree"
  | "Pursuing a graduate degree (e.g. Masters)"
  | "Pursuing a doctoral degree (e.g. PhD)"
  | "Pursuing other degree/diploma"
  | "Working (0-5 years of experience)"
  | "Working (6-15 years of experience)"
  | "Working (15+ years of experience)"
  | "Not employed, but looking"
  | "Retired";

type CareerStage = {
  value: CareerStageValue;
  label: string;
  icon: ForumIconName;
  EAGLabel: EAGCareerStage;
};

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

export type RateLimitReason = "moderator" | "lowKarma" | "downvoteRatio" | "universal";

export const graphqlTypeDefs = gql`
  type LatLng {
    lat: Float!
    lng: Float!
  }
`;

const postsMetadataSchema = new SimpleSchema({
  postId: {
    type: String,
    foreignKey: "Posts",
    optional: true,
  },
});

const emailsSchema = new SimpleSchema({
  address: {
    type: String,
    optional: true,
    regEx: SimpleSchema.RegEx.Email,
  },
  verified: {
    type: Boolean,
    optional: true,
  },
});

function userHasGoogleLocation(data: Partial<DbUser> | CreateUserDataInput | UpdateUserDataInput) {
  return "googleLocation" in data;
}

function convertGoogleToMongoLocation(user: DbUser) {
  if (user.googleLocation) return googleLocationToMongoLocation(user.googleLocation);
  return null;
}

function userHasMapLocation(data: Partial<DbUser> | CreateUserDataInput | UpdateUserDataInput) {
  return "mapLocation" in data;
}

function getMapLocationSet(user: DbUser) {
  return !!user.mapLocation;
}

function userHasMapMarkerText(data: Partial<DbUser> | CreateUserDataInput | UpdateUserDataInput) {
  return "mapMarkerText" in data;
}

async function convertMapMarkerTextToHtml(user: DbUser) {
  if (!user.mapMarkerText) return "";
  return await markdownToHtml(user.mapMarkerText);
}

function userHasNearbyEventsNotificationsLocation(data: Partial<DbUser> | CreateUserDataInput | UpdateUserDataInput) {
  return "nearbyEventsNotificationsLocation" in data;
}

function convertNearbyEventsNotificationsToMongoLocation(user: DbUser) {
  if (user.nearbyEventsNotificationsLocation)
    return googleLocationToMongoLocation(user.nearbyEventsNotificationsLocation);
}

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  moderationGuidelines: {
    database: {
      type: "JSONB",
      nullable: true,
      logChanges: false,
      typescriptType: "EditableFieldContents",
    },
    graphql: {
      outputType: "Revision",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      editableFieldOptions: { pingbacks: false, normalized: false },
      arguments: "version: String",
      resolver: getDenormalizedEditableResolver("Users", "moderationGuidelines"),
      validation: {
        simpleSchema: RevisionStorageType,
        optional: true,
      },
    },
    form: {
      form: {
        hintText: () => defaultEditorPlaceholder,
        fieldName: "moderationGuidelines",
        collectionName: "Users",
        commentEditor: true,
        commentStyles: true,
        hideControls: false,
      },
      order: 50,
      control: "EditorFormComponent",
      hidden: !hasAuthorModeration,
      group: () => formGroups.moderationGroup,
      editableFieldOptions: {
        getLocalStorageId: getDefaultLocalStorageIdGenerator("Users"),
        revisionsHaveCommitMessages: false,
      },
    },
  },
  moderationGuidelines_latest: DEFAULT_LATEST_REVISION_ID_FIELD,
  howOthersCanHelpMe: {
    database: {
      type: "JSONB",
      nullable: true,
      logChanges: false,
      typescriptType: "EditableFieldContents",
    },
    graphql: {
      outputType: "Revision",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      editableFieldOptions: { pingbacks: false, normalized: false },
      arguments: "version: String",
      resolver: getDenormalizedEditableResolver("Users", "howOthersCanHelpMe"),
      validation: {
        simpleSchema: RevisionStorageType,
        optional: true,
      },
    },
    form: {
      hidden: true,
      order: 7,
      control: "EditorFormComponent",
      group: () => formGroups.aboutMe,
      form: {
        label: "How others can help me",
        hintText: () => "Ex: I am looking for opportunities to do...",
        fieldName: "howOthersCanHelpMe",
        collectionName: "Users",
        commentEditor: true,
        commentStyles: true,
        hideControls: false,
        formVariant: isFriendlyUI ? "grey" : undefined,
      },
      editableFieldOptions: {
        getLocalStorageId: getDefaultLocalStorageIdGenerator("Users"),
        revisionsHaveCommitMessages: false,  
      },
    },
  },
  howOthersCanHelpMe_latest: DEFAULT_LATEST_REVISION_ID_FIELD,
  
  howICanHelpOthers: {
    database: {
      type: "JSONB",
      nullable: true,
      logChanges: false,
      typescriptType: "EditableFieldContents",
    },
    graphql: {
      outputType: "Revision",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      editableFieldOptions: { pingbacks: false, normalized: false },
      arguments: "version: String",
      resolver: getDenormalizedEditableResolver("Users", "howICanHelpOthers"),
      validation: {
        simpleSchema: RevisionStorageType,
        optional: true,
      },
    },
    form: {
      hidden: true,
      order: 8,
      group: () => formGroups.aboutMe,
      form: {
        label: "How I can help others",
        hintText: () => "Ex: Reach out to me if you have questions about...",
        fieldName: "howOthersCanHelpMe",
        collectionName: "Users",
        commentEditor: true,
        commentStyles: true,
        hideControls: false,
        formVariant: isFriendlyUI ? "grey" : undefined,
      },
      editableFieldOptions: {
        getLocalStorageId: getDefaultLocalStorageIdGenerator("Users"),
        revisionsHaveCommitMessages: false,  
      },
    },
  },
  howICanHelpOthers_latest: DEFAULT_LATEST_REVISION_ID_FIELD,
  
  slug: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      inputType: "String",
      canRead: ["guests"],
      canCreate: ["admins"],
      canUpdate: ["admins"],
      slugCallbackOptions: {
        collectionsToAvoidCollisionsWith: ["Users"],
        getTitle: (u) => u.displayName ?? createDisplayName(u),
        onCollision: "rejectIfExplicit",
        includesOldSlugs: true,
      },
      validation: {
        optional: true,
      },
    },
    form: {
      order: 40,
      group: () => formGroups.adminOptions,
    },
  },
  oldSlugs: {
    database: {
      type: "TEXT[]",
      defaultValue: [],
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "[String!]!",
      inputType: "[String!]",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  // biography: Some text the user provides for their profile page and to display
  // when people hover over their name.
  //
  // Replaces the old "bio" and "htmlBio" fields, which were markdown only, and
  // which now exist as resolver-only fields for back-compatibility.
  biography: {
    database: {
      type: "JSONB",
      nullable: true,
      logChanges: false,
      typescriptType: "EditableFieldContents",
    },
    graphql: {
      outputType: "Revision",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      editableFieldOptions: { pingbacks: false, normalized: false },
      arguments: "version: String",
      resolver: getDenormalizedEditableResolver("Users", "biography"),
      validation: {
        simpleSchema: RevisionStorageType,
        optional: true,
      },
    },
    form: {
      form: {
        label: "Bio",
        hintText: () => "Tell us about yourself",
        fieldName: "biography",
        collectionName: "Users",
        commentEditor: true,
        commentStyles: true,
        hideControls: false,
        formVariant: isFriendlyUI ? "grey" : undefined,
      },
      order: isEAForum ? 6 : 40,
      control: "EditorFormComponent",
      hidden: isEAForum,
      group: () => (isEAForum ? formGroups.aboutMe : formGroups.default),
      editableFieldOptions: {
        getLocalStorageId: getDefaultLocalStorageIdGenerator("Users"),
        revisionsHaveCommitMessages: false,
      },
    },
  },
  biography_latest: DEFAULT_LATEST_REVISION_ID_FIELD,
  
  username: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  // Emails (not to be confused with email). This field belongs to Meteor's
  // accounts system; we should never write it, but we do need to read it to find
  // out whether a user's email address is verified.
  // FIXME: Update this comment, it's horribly out of date.
  emails: {
    database: {
      type: "JSONB[]",
    },
    graphql: {
      outputType: "[JSON!]",
      inputType: "[JSON!]",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      // FIXME
      // This is dead code and doesn't actually run, but we do have to implement something like this in a post Meteor world
      // RM: is that comment actually true?  I'm not sure it doesn't run...
      onCreate: ({ document: user }) => {
        const oAuthEmail =
          getNestedProperty(user, "services.facebook.email") |
          getNestedProperty(user, "services.google.email") |
          getNestedProperty(user, "services.github.email") |
          getNestedProperty(user, "services.linkedin.emailAddress");
        if (oAuthEmail) {
          return [{ address: oAuthEmail, verified: true }];
        }
      },
      validation: {
        optional: true,
        simpleSchema: [emailsSchema],
      },
    },
  },
  isAdmin: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean!",
      inputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "realAdmins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Admin",
      control: "checkbox",
      group: () => adminGroup,
    },
  },
  // A mostly-legacy field. For OAuth users, includes information that was
  // submitted with the OAuth login; for users imported from old LW, includes
  // a link.
  profile: {
    database: {
      type: "JSONB",
    },
    graphql: {
      outputType: "JSON",
      canRead: ["guests"],
      // GraphQL resolver is provided for API back-compat (issarice's reader
      // has it in its user fragment), but only returns an empty object.
      resolver: (user, args, context) => ({
        fieldNoLongerSupported: true
      }),
    },
    form: {
      hidden: true,
    },
  },
  services: {
    database: {
      type: "JSONB",
    },
    graphql: {
      outputType: "JSON",
      canRead: ownsOrIsAdmin,
      validation: {
        optional: true,
        blackbox: true,
      },
    },
  },
  /** hasAuth0Id: true if they use auth0 with username/password login, false otherwise */
  hasAuth0Id: {
    graphql: {
      outputType: "Boolean",
      // Mods cannot read because they cannot read services, which is a prerequisite
      canRead: [userOwns, "admins"],
      resolver: (user) => {
        return getAuth0Provider(user) === "auth0";
      },
    },
  },
  // The name displayed throughout the app. Can contain spaces and special characters, doesn't need to be unique
  // Hide the option to change your displayName (for now) TODO: Create proper process for changing name
  displayName: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
      // On the EA Forum name changing is rate limited in rateLimitCallbacks
      canUpdate: ["sunshineRegiment", "admins", isEAForum ? 'members' : userHasntChangedName],
      canCreate: ["sunshineRegiment", "admins"],
      onCreate: ({ document: user }) => {
        return user.displayName || createDisplayName(user);
      },
      validation: {
        optional: true,
      },
    },
    form: {
      order: 10,
      hidden: isFriendlyUI,
      control: isFriendlyUI ? 'FormComponentFriendlyDisplayNameInput' : undefined,
      group: () => formGroups.default,
    },
  },
  /**
   Used for tracking changes of displayName
   */
  previousDisplayName: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 11,
      group: () => formGroups.default,
    },
  },
  email: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ownsOrIsMod,
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: ({ document: user }) => {
        // look in a few places for the user email
        const facebookEmail = getNestedProperty(user, "services.facebook.email");
        const githubEmail = getNestedProperty(user, "services.github.email");
        const googleEmail = getNestedProperty(user, "services.google.email");
        const linkedinEmail = getNestedProperty(user, "services.linkedin.emailAddress");
        if (facebookEmail) return facebookEmail;
        if (githubEmail) return githubEmail;
        if (googleEmail) return googleEmail;
        if (linkedinEmail) return linkedinEmail;
        return undefined;
      },
      onUpdate: (props) => {
        const { data, newDocument, oldDocument } = props;
        if (oldDocument.email?.length && !newDocument.email) {
          throw new Error("You cannot remove your email address");
        }
        return data.email;
      },
      validation: {
        regEx: SimpleSchema.RegEx.Email,
        optional: true,
      },
    },
    form: {
      // Will always be disabled for mods, because they cannot read hasAuth0Id
      form: { disabled: ({ document }) => isEAForum && !(document as AnyBecauseHard)?.hasAuth0Id },
      order: 20,
      control: "text",
      group: () => formGroups.default,
    },
  },
  noindex: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean!",
      inputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 48,
      label: "No Index",
      tooltip: "Hide this user's profile from search engines",
      group: () => formGroups.adminOptions,
    },
  },
  groups: {
    database: {
      type: "TEXT[]",
    },
    graphql: {
      outputType: "[String!]",
      inputType: "[String!]",
      canRead: ["guests"],
      canUpdate: ["alignmentForumAdmins", "admins", "realAdmins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      form: {
        options: function () {
          const groups = _.without(_.keys(getAllUserGroups()), "guests", "members", "admins");
          return groups.map((group) => {
            return {
              value: group,
              label: group,
            };
          });
        },
      },
      control: "checkboxgroup",
      group: () => adminGroup,
    },
  },
  pageUrl: {
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      resolver: (user, args, context) => {
        return userGetProfileUrl(user, true);
      },
    },
  },
  pagePath: {
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      resolver: (user, args, context) => {
        return userGetProfileUrl(user, false);
      },
    },
  },
  editUrl: {
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      resolver: (user, args, context) => {
        return userGetEditUrl(user, true);
      },
    },
  },
  lwWikiImport: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  theme: {
    database: {
      type: "JSONB",
      defaultValue: { name: "default" },
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "JSON",
      canRead: ownsOrIsAdmin,
      canUpdate: ownsOrIsAdmin,
      canCreate: ["members"],
      validation: {
        simpleSchema: userTheme,
        optional: true,
      },
    },
    form: {
      order: 1,
      control: "ThemeSelect",
      hidden: isLWorAF,
      group: () => formGroups.siteCustomizations,
    },
  },
  lastUsedTimezone: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  // TODO(EA): Allow resending of confirmation email
  whenConfirmationEmailSent: {
    database: {
      type: "TIMESTAMPTZ",
    },
    graphql: {
      outputType: "Date",
      canRead: ["members"],
      // Editing this triggers a verification email, so don't allow editing on instances (like EAF) that don't use email verification
      canUpdate: verifyEmailsSetting.get()
        ? [userOwns, 'sunshineRegiment', 'admins']
        : [],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 1,
      control: "UsersEmailVerification",
      group: () => formGroups.emails,
    },
  },
  // Legacy: Boolean used to indicate that post was imported from old LW database
  legacy: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  commentSorting: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      // getCommentViewOptions has optional parameters so it's safer to wrap it
      // in a lambda. We don't currently enable admin-only sorting options for
      // admins - we could but it seems not worth the effort.
      form: { options: () => getCommentViewOptions() },
      order: 43,
      control: "select",
      group: () => formGroups.siteCustomizations,
    },
  },
  sortDraftsBy: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      form: {
        options: function () {
          return [
            {
              value: "wordCount",
              label: "Wordcount",
            },
            {
              value: "modifiedAt",
              label: "Last Modified",
            },
          ];
        },
      },
      order: 43,
      label: "Sort Drafts by",
      control: "select",
      group: () => formGroups.siteCustomizations,
    },
  },
  reactPaletteStyle: {
    database: {
      type: "TEXT",
      defaultValue: "listView",
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      validation: {
        allowedValues: ["listView", "gridView"],
        optional: true,
      },
    },
    form: {
      form: {
        options: function () {
          return [
            {
              value: "listView",
              label: "List View",
            },
            {
              value: "iconView",
              label: "Icons",
            },
          ];
        },
      },
      label: "React Palette Style",
      control: "select",
      hidden: isEAForum,
      group: () => formGroups.siteCustomizations,
    },
  },
  noKibitz: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 68,
      label: "Hide author names until I hover over them",
      tooltip:
        "For if you want to not be biased. Adds an option to the user menu to temporarily disable. Does not work well on mobile",
      group: () => formGroups.siteCustomizations,
    },
  },
  showHideKarmaOption: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwnsAndInGroup("trustLevel1"), "sunshineRegiment", "admins"],
      canCreate: ["members", "sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 69,
      label: "Enable option on posts to hide karma visibility",
      control: "checkbox",
      hidden: !isEAForum,
      group: () => formGroups.siteCustomizations,
    },
  },
  // We tested this on the EA Forum and it didn't encourage more PMs, but it led to some profile views.
  // Hiding for now, will probably delete or test another version in the future.
  showPostAuthorCard: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
      control: 'checkbox',
      group: () => formGroups.siteCustomizations,
      order: 70,
      label: "Show my bio at the end of my posts",
    },
  },
  // Intercom: Will the user display the intercom while logged in?
  hideIntercom: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean!",
      inputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 71,
      label: "Hide Intercom",
      control: "checkbox",
      group: () => formGroups.siteCustomizations,
    },
  },
  // This field-name is no longer accurate, but is here because we used to have that field
  // around and then removed `markDownCommentEditor` and merged it into this field.
  markDownPostEditor: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean!",
      inputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 72,
      label: "Activate Markdown Editor",
      control: "checkbox",
      group: () => formGroups.siteCustomizations,
    },
  },
  hideElicitPredictions: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 80,
      label: "Hide other users' Elicit predictions until I have predicted myself",
      control: "checkbox",
      group: () => formGroups.siteCustomizations,
    },
  },
  hideAFNonMemberInitialWarning: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 90,
      label: "Hide explanations of how AIAF submissions work for non-members",
      control: "checkbox",
      hidden: !isAF, //TODO: just hide this in prod
      group: () => formGroups.siteCustomizations,
    },
  },
  noSingleLineComments: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean!",
      inputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 91,
      label: "Do not collapse comments to Single Line",
      control: "checkbox",
      group: () => formGroups.siteCustomizations,
    },
  },
  noCollapseCommentsPosts: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean!",
      inputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 92,
      label: "Do not truncate comments (in large threads on Post Pages)",
      control: "checkbox",
      group: () => formGroups.siteCustomizations,
    },
  },
  noCollapseCommentsFrontpage: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean!",
      inputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 93,
      label: "Do not truncate comments (on home page)",
      control: "checkbox",
      group: () => formGroups.siteCustomizations,
    },
  },
  hideCommunitySection: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean!",
      inputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 93,
      label: "Hide community section from the frontpage",
      control: "checkbox",
      hidden: !isEAForum,
      group: () => formGroups.siteCustomizations,
    },
  },
  expandedFrontpageSections: {
    database: {
      type: "JSONB",
      nullable: true,
    },
    graphql: {
      outputType: "JSON",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        simpleSchema: expandedFrontpageSectionsSettings,
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  // On the EA Forum, we default to hiding posts tagged with "Community" from Recent Discussion
  showCommunityInRecentDiscussion: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean!",
      inputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 94,
      label: "Show Community posts in Recent Discussion",
      control: "checkbox",
      hidden: !isEAForum,
      group: () => formGroups.siteCustomizations,
    },
  },
  hidePostsRecommendations: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean!",
      inputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 95,
      label: "Hide recommendations from the posts page",
      control: "checkbox",
      hidden: !hasPostRecommendations,
      group: () => formGroups.siteCustomizations,
    },
  },
  petrovOptOut: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean!",
      inputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 96,
      label: "Opt out of Petrov Day - you will not be able to launch",
      control: "checkbox",
      group: () => formGroups.siteCustomizations,
      hidden: (new Date()).valueOf() > 1664161200000 
      // note this date is hard coded as a hack
      // we originally were using petrovBeforeTime but it didn't work in this file because the database
      // public settings aren't been loaded yet.
    },
  },
  optedOutOfSurveys: {
    database: {
      type: "BOOL",
      nullable: true,
    },
    graphql: {
      outputType: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 97,
      label: "Opt out of user surveys",
      hidden: !hasSurveys,
      group: () => formGroups.siteCustomizations,
    },
  },
  postGlossariesPinned: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 98,
      label: "Pin glossaries on posts, and highlight all instances of each term",
      hidden: (props) => userCanViewJargonTerms(props.currentUser),
      group: () => formGroups.siteCustomizations,
    },
  },
  generateJargonForDrafts: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["members"],
      canUpdate: [userOwns],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
      group: () => formGroups.siteCustomizations,
    },
  },
  generateJargonForPublishedPosts: {
    database: {
      type: "BOOL",
      defaultValue: true,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["members"],
      canUpdate: [userOwns],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
      group: () => formGroups.siteCustomizations,
    },
  },
  acceptedTos: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  hideNavigationSidebar: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: userOwns,
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: "guests",
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  currentFrontpageFilter: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: userOwns,
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: "guests",
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  frontpageSelectedTab: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: userOwns,
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: "guests",
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  frontpageFilterSettings: {
    database: {
      type: "JSONB",
    },
    graphql: {
      outputType: "JSON",
      canRead: userOwns,
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: "guests",
      // The old schema had the below comment:
      // FIXME this isn't filling default values as intended
      // ...schemaDefaultValue(getDefaultFilterSettings),
      // It'd need to be converted to an `onCreate`, or something, but it doesn't seem to be causing any problems by its lack.
      validation: {
        optional: true,
        blackbox: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  hideFrontpageFilterSettingsDesktop: {
    database: {
      type: "BOOL",
      nullable: true,
    },
    // This used to not have a `canRead`, which seems like a mistake
    graphql: {
      outputType: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: "guests",
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  allPostsTimeframe: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: userOwns,
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: "guests",
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  allPostsFilter: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: userOwns,
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: "guests",
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  allPostsSorting: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: userOwns,
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: "guests",
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  allPostsShowLowKarma: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: userOwns,
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: "guests",
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  allPostsIncludeEvents: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: userOwns,
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: "guests",
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  allPostsHideCommunity: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: userOwns,
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: "guests",
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  allPostsOpenSettings: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: userOwns,
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: "guests",
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  draftsListSorting: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: userOwns,
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: "guests",
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  draftsListShowArchived: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: userOwns,
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: "guests",
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  draftsListShowShared: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: userOwns,
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: "guests",
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  lastNotificationsCheck: {
    database: {
      type: "TIMESTAMPTZ",
      logChanges: false,
    },
    graphql: {
      outputType: "Date",
      canRead: [userOwns, "admins"],
      canUpdate: userOwns,
      canCreate: "guests",
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  karma: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Float!",
      inputType: "Float",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  goodHeartTokens: {
    database: {
      type: "DOUBLE PRECISION",
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  moderationStyle: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["members", "sunshineRegiment", "admins"],
      canCreate: ["members", "sunshineRegiment", "admins"],
      validation: {
        optional: true,
        blackbox: true,
      },
    },
    form: {
      form: {
        options: function () {
          return [
            {
              value: "",
              label: "No Moderation",
            },
            {
              value: "easy-going",
              label: "Easy Going - I just delete obvious spam and trolling.",
            },
            {
              value: "norm-enforcing",
              label: "Norm Enforcing - I try to enforce particular rules (see below)",
            },
            {
              value: "reign-of-terror",
              label: "Reign of Terror - I delete anything I judge to be annoying or counterproductive",
            },
          ];
        },
      },
      order: 55,
      label: "Style",
      control: "select",
      hidden: isFriendlyUI,
      group: () => formGroups.moderationGroup,
    },
  },
  moderatorAssistance: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members", "sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 55,
      label: "I'm happy for site moderators to help enforce my policy",
      control: "checkbox",
      hidden: isFriendlyUI,
      group: () => formGroups.moderationGroup,
    },
  },
  collapseModerationGuidelines: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members", "sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 56,
      label: "On my posts, collapse my moderation guidelines by default",
      control: "checkbox",
      hidden: isFriendlyUI,
      group: () => formGroups.moderationGroup,
    },
  },
  // bannedUserIds: users who are not allowed to comment on this user's posts
  bannedUserIds: {
    database: {
      type: "VARCHAR(27)[]",
    },
    graphql: {
      outputType: "[String!]",
      inputType: "[String!]",
      canRead: ["guests"],
      canUpdate: [userOwnsAndInGroup("trustLevel1"), "sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Banned Users (All)",
      control: "FormUserMultiselect",
      group: () => formGroups.moderationGroup,
    },
  },
  // bannedPersonalUserIds: users who are not allowed to comment on this user's personal blog posts
  bannedPersonalUserIds: {
    database: {
      type: "VARCHAR(27)[]",
    },
    graphql: {
      outputType: "[String!]",
      inputType: "[String!]",
      canRead: ["guests"],
      canUpdate: [userOwnsAndInGroup("canModeratePersonal"), "sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Banned Users (Personal)",
      tooltip:
        "Users who are banned from commenting on your personal blogposts (will not affect posts promoted to frontpage)",
      control: "FormUserMultiselect",
      group: () => formGroups.moderationGroup,
    },
  },
  bookmarkedPostsMetadata: {
    database: {
      type: "JSONB[]",
      defaultValue: [],
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "[JSON!]",
      inputType: "[JSON!]",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      onCreate: arrayOfForeignKeysOnCreate,
      onUpdate: ({ data, currentUser, oldDocument }) => {
        if (data?.bookmarkedPostsMetadata) {
          return _.uniq(data?.bookmarkedPostsMetadata, "postId");
        }
      },
      validation: {
        optional: true,
        simpleSchema: [postsMetadataSchema],
      },
    },
    form: {
      hidden: true,
    },
  },
  bookmarkedPosts: {
    graphql: {
      outputType: "[Post!]",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      resolver: generateIdResolverMulti({
        foreignCollectionName: "Posts",
        fieldName: "bookmarkedPostsMetadata",
        getKey: (obj) => obj.postId,
      }),
    },
  },
  // Note: this data model was chosen mainly for expediency: bookmarks has the same one, so we know it works,
  // and it was easier to add a property vs. making a new object. If the creator had more time, they'd instead
  // model this closer to ReadStatuses: an object per hidden thread + user pair, and exposing the hidden status
  // as a property on thread. 
  //
  // That said, this is likely fine given this is a power use feature, but if it ever gives anyone any problems
  // feel free to change it!
  hiddenPostsMetadata: {
    database: {
      type: "JSONB[]",
      defaultValue: [],
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "[JSON!]",
      inputType: "[JSON!]",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      onCreate: arrayOfForeignKeysOnCreate,
      onUpdate: ({ data, currentUser, oldDocument }) => {
        if (data?.hiddenPostsMetadata) {
          return uniqBy(data?.hiddenPostsMetadata, "postId");
        }
      },
      validation: {
        optional: true,
        simpleSchema: [postsMetadataSchema],
      },
    },
    form: {
      hidden: true,
    },
  },
  hiddenPosts: {
    graphql: {
      outputType: "[Post!]",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      resolver: generateIdResolverMulti({
        foreignCollectionName: "Posts",
        fieldName: "hiddenPostsMetadata",
        getKey: (obj) => obj.postId
      }),
    },
  },
  // Legacy ID: ID used in the original LessWrong database
  legacyId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  deleted: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean!",
      inputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["members", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Deactivate",
      tooltip: "Your posts and comments will be listed as '[Anonymous]', and your user profile won't accessible.",
      control: "checkbox",
      hidden: hasAccountDeletionFlow,
      group: () => formGroups.deactivate,
    },
  },
  // permanentDeletionRequestedAt: The date the user requested their account to be permanently deleted,
  // it will be deleted by the script in packages/lesswrong/server/users/permanentDeletion.ts after a cooling
  // off period
  permanentDeletionRequestedAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      outputType: "Date",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: ["members", "admins"],
      onUpdate: ({ data }) => {
        if (!data.permanentDeletionRequestedAt) return data.permanentDeletionRequestedAt;
        // Whenever the field is set, reset it to the current server time to ensure users
        // can't work around the cooling off period
        return new Date();
      },
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  // DEPRECATED
  // voteBanned: All future votes of this user have weight 0
  voteBanned: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
      control: 'checkbox',
      group: () => formGroups.banUser,
      label: 'Set all future votes of this user to have zero weight',  
    },
  },
  // nullifyVotes: Set all historical votes of this user to 0, and make any future votes have a vote weight of 0
  nullifyVotes: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Nullify all past votes",
      control: "checkbox",
      group: () => formGroups.banUser,
    },
  },
  // deleteContent: Flag all comments and posts from this user as deleted
  deleteContent: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Delete all user content",
      control: "checkbox",
      group: () => formGroups.banUser,
    },
  },
  banned: {
    database: {
      type: "TIMESTAMPTZ",
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Ban user until",
      control: "datetime",
      group: () => formGroups.banUser,
    },
  },
  // IPs: All Ips that this user has ever logged in with
  // We probably shouldn't use this field right now because LWEvents is huge
  // and the perf would be awful.
  IPs: {
    graphql: {
      outputType: "[String!]",
      canRead: ["sunshineRegiment", "admins"],
      resolver: async (user, args, context) => {
        const { currentUser, LWEvents } = context;
        const events = await LWEvents.find(
          {
            userId: user._id,
            name: "login",
          },
          {
            limit: 10,
            sort: {
              createdAt: -1,
            },
          }
        ).fetch();
        const filteredEvents = await accessFilterMultiple(currentUser, "LWEvents", events, context);
        const IPs = filteredEvents.map((event) => event.properties?.ip);
        const uniqueIPs = _.uniq(IPs);
        return uniqueIPs;
      },
    },
    form: {
      group: () => formGroups.banUser,
    },
  },
  auto_subscribe_to_my_posts: {
    database: {
      type: "BOOL",
      defaultValue: true,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean!",
      inputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      beforeComponent: "ManageSubscriptionsLink",
      label: "Auto-subscribe to comments on my posts",
      control: "checkbox",
      group: () => formGroups.notifications,
    },
  },
  auto_subscribe_to_my_comments: {
    database: {
      type: "BOOL",
      defaultValue: true,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean!",
      inputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Auto-subscribe to replies to my comments",
      control: "checkbox",
      group: () => formGroups.notifications,
    },
  },
  autoSubscribeAsOrganizer: {
    database: {
      type: "BOOL",
      defaultValue: true,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean!",
      inputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Auto-subscribe to posts/events in groups I organize",
      control: "checkbox",
      hidden: !hasEventsSetting.get(),
      group: () => formGroups.notifications,
    },
  },
  notificationCommentsOnSubscribedPost: {
    database: {
      type: "JSONB",
      defaultValue: defaultNotificationTypeSettings,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      ...DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
      ...(isEAForum ? { onCreate: () => dailyEmailBatchNotificationSettingOnCreate } : {}),
    },
    form: {
      label: "Comments on posts/events I'm subscribed to",
      control: "NotificationTypeSettingsWidget",
      group: () => formGroups.notifications,
    },
  },
  notificationShortformContent: {
    database: {
      type: "JSONB",
      defaultValue: defaultNotificationTypeSettings,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      ...DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
      ...(isEAForum ? { onCreate: () => dailyEmailBatchNotificationSettingOnCreate } : {}),
    },
    form: {
      label: isEAForum
        ? "Quick takes by users I'm subscribed to"
        : "Shortform by users I'm subscribed to",
      control: "NotificationTypeSettingsWidget",
      group: () => formGroups.notifications,
    },
  },
  notificationRepliesToMyComments: {
    database: {
      type: "JSONB",
      defaultValue: defaultNotificationTypeSettings,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      ...DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
      ...(isEAForum ? { onCreate: () => emailEnabledNotificationSettingOnCreate } : {}),
    },
    form: {
      label: "Replies to my comments",
      control: "NotificationTypeSettingsWidget",
      group: () => formGroups.notifications,
    },
  },
  notificationRepliesToSubscribedComments: {
    database: {
      type: "JSONB",
      defaultValue: defaultNotificationTypeSettings,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      ...DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
      ...(isEAForum ? { onCreate: () => dailyEmailBatchNotificationSettingOnCreate } : {}),
    },
    form: {
      label: "Replies to comments I'm subscribed to",
      control: "NotificationTypeSettingsWidget",
      group: () => formGroups.notifications,
    },
  },
  notificationSubscribedUserPost: {
    database: {
      type: "JSONB",
      defaultValue: defaultNotificationTypeSettings,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      ...DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
      ...(isEAForum ? { onCreate: () => dailyEmailBatchNotificationSettingOnCreate } : {}),
    },
    form: {
      label: "Posts by users I'm subscribed to",
      control: "NotificationTypeSettingsWidget",
      group: () => formGroups.notifications,
    },
  },
  notificationSubscribedUserComment: {
    database: {
      type: "JSONB",
      defaultValue: defaultNotificationTypeSettings,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      ...DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
      ...(isEAForum ? { onCreate: () => dailyEmailBatchNotificationSettingOnCreate } : {}),
    },
    form: {
      label: "Comments by users I'm subscribed to",
      control: "NotificationTypeSettingsWidget",
      hidden: false,
      group: () => formGroups.notifications,
    },
  },
  notificationPostsInGroups: {
    database: {
      type: "JSONB",
      defaultValue: bothChannelsEnabledNotificationTypeSettings,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
    form: {
      label: "Posts/events in groups I'm subscribed to",
      control: "NotificationTypeSettingsWidget",
      hidden: !hasEventsSetting.get(),
      group: () => formGroups.notifications,
    },
  },
  notificationSubscribedTagPost: {
    database: {
      type: "JSONB",
      defaultValue: defaultNotificationTypeSettings,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
    form: {
      label: "Posts added to tags I'm subscribed to",
      control: "NotificationTypeSettingsWidget",
      group: () => formGroups.notifications,
    },
  },
  notificationSubscribedSequencePost: {
    database: {
      type: "JSONB",
      defaultValue: bothChannelsEnabledNotificationTypeSettings,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
    form: {
      label: "Posts added to sequences I'm subscribed to",
      control: "NotificationTypeSettingsWidget",
      hidden: !allowSubscribeToSequencePosts,
      group: () => formGroups.notifications,
    },
  },
  notificationPrivateMessage: {
    database: {
      type: "JSONB",
      defaultValue: bothChannelsEnabledNotificationTypeSettings,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
    form: {
      label: "Private messages",
      control: "NotificationTypeSettingsWidget",
      group: () => formGroups.notifications,
    },
  },
  notificationSharedWithMe: {
    database: {
      type: "JSONB",
      defaultValue: bothChannelsEnabledNotificationTypeSettings,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
    form: {
      label: "Draft shared with me",
      control: "NotificationTypeSettingsWidget",
      group: () => formGroups.notifications,
    },
  },
  notificationAlignmentSubmissionApproved: {
    database: {
      type: "JSONB",
      defaultValue: bothChannelsEnabledNotificationTypeSettings,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
    form: {
      label: "Alignment Forum submission approvals",
      control: "NotificationTypeSettingsWidget",
      hidden: !isLWorAF,
      group: () => formGroups.notifications,
    },
  },
  notificationEventInRadius: {
    database: {
      type: "JSONB",
      defaultValue: bothChannelsEnabledNotificationTypeSettings,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
    form: {
      label: "New events in my notification radius",
      control: "NotificationTypeSettingsWidget",
      hidden: !hasEventsSetting.get(),
      group: () => formGroups.notifications,
    },
  },
  notificationKarmaPowersGained: {
    database: {
      type: "JSONB",
      defaultValue: defaultNotificationTypeSettings,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      ...DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
      ...(isEAForum ? { onCreate: () => emailEnabledNotificationSettingOnCreate } : {}),
    },
    form: {
      hidden: true,
      label: "Karma powers gained",
      control: "NotificationTypeSettingsWidget",
      group: () => formGroups.notifications,
    },
  },
  notificationRSVPs: {
    database: {
      type: "JSONB",
      defaultValue: bothChannelsEnabledNotificationTypeSettings,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
    form: {
      label: "New RSVP responses to my events",
      control: "NotificationTypeSettingsWidget",
      hidden: !hasEventsSetting.get(),
      group: () => formGroups.notifications,
    },
  },
  notificationGroupAdministration: {
    database: {
      type: "JSONB",
      defaultValue: bothChannelsEnabledNotificationTypeSettings,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
    form: {
      label: "Group administration notifications",
      control: "NotificationTypeSettingsWidget",
      hidden: !hasEventsSetting.get(),
      group: () => formGroups.notifications,
    },
  },
  notificationCommentsOnDraft: {
    database: {
      type: "JSONB",
      defaultValue: bothChannelsEnabledNotificationTypeSettings,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
    form: {
      label: "Comments on unpublished draft posts I've shared",
      control: "NotificationTypeSettingsWidget",
      group: () => formGroups.notifications,
    },
  },
  notificationPostsNominatedReview: {
    database: {
      type: "JSONB",
      defaultValue: bothChannelsEnabledNotificationTypeSettings,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
    form: {
      // Hide this while review is inactive
      hidden: true,
      label: `Nominations of my posts for the ${REVIEW_NAME_IN_SITU}`,
      control: "NotificationTypeSettingsWidget",
      group: () => formGroups.notifications,
    },
  },
  notificationSubforumUnread: {
    database: {
      type: "JSONB",
      defaultValue: {
        onsite: { ...defaultNotificationTypeSettings.onsite, batchingFrequency: "daily" },
        email: defaultNotificationTypeSettings.email,
      },
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
    form: {
      label: "New discussions in topics I'm subscribed to",
      control: "NotificationTypeSettingsWidget",
      group: () => formGroups.notifications,
    },
  },
  notificationNewMention: {
    database: {
      type: "JSONB",
      defaultValue: defaultNotificationTypeSettings,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      ...DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
      ...(isEAForum ? { onCreate: () => emailEnabledNotificationSettingOnCreate } : {}),
    },
    form: {
      label: "Someone has mentioned me in a post or a comment",
      control: "NotificationTypeSettingsWidget",
      group: () => formGroups.notifications,
    },
  },
  notificationDialogueMessages: {
    database: {
      type: "JSONB",
      defaultValue: bothChannelsEnabledNotificationTypeSettings,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
    form: {
      label: "New dialogue content in a dialogue I'm participating in",
      control: "NotificationTypeSettingsWidget",
      hidden: false,
      group: () => formGroups.notifications,
    },
  },
  notificationPublishedDialogueMessages: {
    database: {
      type: "JSONB",
      defaultValue: defaultNotificationTypeSettings,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
    form: {
      label: "New dialogue content in a dialogue I'm subscribed to",
      control: "NotificationTypeSettingsWidget",
      hidden: false,
      group: () => formGroups.notifications,
    },
  },
  notificationAddedAsCoauthor: {
    database: {
      type: "JSONB",
      defaultValue: bothChannelsEnabledNotificationTypeSettings,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
    form: {
      label: "Someone has added me as a coauthor to a post",
      control: "NotificationTypeSettingsWidget",
      group: () => formGroups.notifications,
    },
  },
  //TODO: clean up old dialogue implementation notifications
  notificationDebateCommentsOnSubscribedPost: {
    database: {
      type: "JSONB",
      defaultValue: {
        onsite: { ...defaultNotificationTypeSettings.onsite, batchingFrequency: "daily" },
        email: defaultNotificationTypeSettings.email,
      },
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
    form: {
      label: "[Old Style] New dialogue content in a dialogue I'm subscribed to",
      control: "NotificationTypeSettingsWidget",
      hidden: !isLW,
      group: () => formGroups.notifications,
    },
  },
  notificationDebateReplies: {
    database: {
      type: "JSONB",
      defaultValue: defaultNotificationTypeSettings,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
    form: {
      label: "[Old Style] New dialogue content in a dialogue I'm participating in",
      control: "NotificationTypeSettingsWidget",
      hidden: !isLW,
      group: () => formGroups.notifications,
    },
  },
  notificationDialogueMatch: {
    database: {
      type: "JSONB",
      defaultValue: bothChannelsEnabledNotificationTypeSettings,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
    form: {
      label: "Another user and I have matched for a dialogue",
      control: "NotificationTypeSettingsWidget",
      hidden: !isLW,
      group: () => formGroups.notifications,
    },
  },
  notificationNewDialogueChecks: {
    database: {
      type: "JSONB",
      defaultValue: {
        onsite: { ...defaultNotificationTypeSettings.onsite, enabled: false },
        email: defaultNotificationTypeSettings.email,
      },
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
    form: {
      label: "You have new people interested in dialogue-ing with you",
      control: "NotificationTypeSettingsWidget",
      hidden: !isLW,
      group: () => formGroups.notifications,
    },
  },
  notificationYourTurnMatchForm: {
    database: {
      type: "JSONB",
      defaultValue: defaultNotificationTypeSettings,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
    form: {
      label: "Fill in the topics form for your dialogue match",
      control: "NotificationTypeSettingsWidget",
      hidden: !isLW,
      group: () => formGroups.notifications,
    },
  },
  hideDialogueFacilitation: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Hide the widget for opting in to being approached about dialogues",
      hidden: !isLW,
      group: () => formGroups.siteCustomizations,
    },
  },
  revealChecksToAdmins: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Allow users to reveal their checks for better facilitation",
      hidden: !isLW,
      group: () => formGroups.siteCustomizations,
    },
  },
  optedInToDialogueFacilitation: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Opted-in to receiving invitations for dialogue facilitation from LessWrong team",
      hidden: !isLW,
      group: () => formGroups.siteCustomizations,
    },
  },
  showDialoguesList: {
    database: {
      type: "BOOL",
      defaultValue: true,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
    },
    form: {
      label: "Show a list of recently active dialogues inside the frontpage widget",
      hidden: !isLW,
      group: () => formGroups.siteCustomizations,
    },
  },
  showMyDialogues: {
    database: {
      type: "BOOL",
      defaultValue: true,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
    },
    form: {
      label: "Show a list of dialogues the user participated in inside the frontpage widget",
      hidden: !isLW,
      group: () => formGroups.siteCustomizations,
    },
  },
  showMatches: {
    database: {
      type: "BOOL",
      defaultValue: true,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
    },
    form: {
      label: "Show a list of dialogue reciprocity matched users inside frontpage widget",
      hidden: !isLW,
      group: () => formGroups.siteCustomizations,
    },
  },
  showRecommendedPartners: {
    database: {
      type: "BOOL",
      defaultValue: true,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
    },
    form: {
      label: "Show a list of recommended dialogue partners inside frontpage widget",
      hidden: !isLW,
      group: () => formGroups.siteCustomizations,
    },
  },
  hideActiveDialogueUsers: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Hides/collapses the active dialogue users in the header",
      hidden: !isLW,
      group: () => formGroups.siteCustomizations,
    },
  },
  karmaChangeNotifierSettings: {
    database: {
      type: "JSONB",
      defaultValue: { updateFrequency: "daily", timeOfDayGMT: 11, dayOfWeekGMT: "Saturday", showNegativeKarma: false },
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["guests"],
      validation: {
        simpleSchema: karmaChangeSettingsType,
        optional: true,
      },
    },
    form: {
      control: "KarmaChangeNotifierSettings",
      group: () => formGroups.notifications,
    },
  },
  karmaChangeLastOpened: {
    database: {
      type: "TIMESTAMPTZ",
      logChanges: false,
    },
    graphql: {
      outputType: "Date",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["guests"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },

  // If, the last time you opened the karma-change notifier, you saw more than
  // just the most recent batch (because there was a batch you hadn't viewed),
  // the start of the date range of that batch.
  karmaChangeBatchStart: {
    database: {
      type: "TIMESTAMPTZ",
      logChanges: false,
    },
    graphql: {
      outputType: "Date",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["guests"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  emailSubscribedToCurated: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["members"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Email me new posts in Curated",
      control: "EmailConfirmationRequiredCheckbox",
      hidden: !isLW,
      group: () => formGroups.emails,
    },
  },
  subscribedToDigest: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["members"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Subscribe to the EA Forum Digest emails — once a week curated posts from the Forum",
      hidden: !isEAForum,
      group: () => formGroups.emails,
    },
  },
  subscribedToNewsletter: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["members"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Subscribe to the EA Newsletter — once a month emails with content from around the web",
      hidden: !isEAForum,
      group: () => formGroups.emails,
    },
  },
  unsubscribeFromAll: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Do not send me any emails (unsubscribe from all)",
      group: () => formGroups.emails,
    },
  },
  hideSubscribePoke: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  hideMeetupsPoke: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  // Used by the EA Forum to allow users to hide the right-hand side of the home page
  hideHomeRHS: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  // frontpagePostCount: count of how many posts of yours were posted on the frontpage
  frontpagePostCount: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      denormalized: true,
      canAutoDenormalize: true,
      canAutofillDefault: true,
      getValue: getDenormalizedCountOfReferencesGetValue({
        collectionName: "Users",
        fieldName: "frontpagePostCount",
        foreignCollectionName: "Posts",
        foreignFieldName: "userId",
        filterFn: (post) => !!post.frontpageDate,
      }),
      nullable: false,
    },
    graphql: {
      outputType: "Float!",
      inputType: "Float",
      canRead: ["guests"],
      onCreate: () => 0,
      countOfReferences: {
        foreignCollectionName: "Posts",
        foreignFieldName: "userId",
        filterFn: (post) => !!post.frontpageDate,
        resyncElastic: false,
      },
      validation: {
        optional: true,
      },
    },
  },
  // sequenceCount: count of how many non-draft, non-deleted sequences you have
  sequenceCount: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      denormalized: true,
      canAutoDenormalize: true,
      canAutofillDefault: true,
      getValue: getDenormalizedCountOfReferencesGetValue({
        collectionName: "Users",
        fieldName: "sequenceCount",
        foreignCollectionName: "Sequences",
        foreignFieldName: "userId",
        filterFn: (sequence) => !sequence.draft && !sequence.isDeleted && !sequence.hideFromAuthorPage,
      }),
      nullable: false,
    },
    graphql: {
      outputType: "Float!",
      inputType: "Float",
      canRead: ["guests"],
      onCreate: () => 0,
      countOfReferences: {
        foreignCollectionName: "Sequences",
        foreignFieldName: "userId",
        filterFn: (sequence) => !sequence.draft && !sequence.isDeleted && !sequence.hideFromAuthorPage,
        resyncElastic: false,
      },
      validation: {
        optional: true,
      },
    },
  },
  // sequenceDraftCount: count of how many draft, non-deleted sequences you have
  sequenceDraftCount: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      denormalized: true,
      canAutoDenormalize: true,
      canAutofillDefault: true,
      getValue: getDenormalizedCountOfReferencesGetValue({
        collectionName: "Users",
        fieldName: "sequenceDraftCount",
        foreignCollectionName: "Sequences",
        foreignFieldName: "userId",
        filterFn: (sequence) => sequence.draft && !sequence.isDeleted,
      }),
      nullable: false,
    },
    graphql: {
      outputType: "Float!",
      inputType: "Float",
      canRead: ["guests"],
      onCreate: () => 0,
      countOfReferences: {
        foreignCollectionName: "Sequences",
        foreignFieldName: "userId",
        filterFn: (sequence) => sequence.draft && !sequence.isDeleted,
        resyncElastic: false,
      },
      validation: {
        optional: true,
      },
    },
  },
  // Should match googleLocation/location
  // Determines which events are considered nearby for default sorting on the community page
  // Determines where the community map is centered/zoomed in on by default
  // Not shown to other users
  mongoLocation: {
    database: {
      type: "JSONB",
      denormalized: true,
      canAutoDenormalize: true,
      needsUpdate: userHasGoogleLocation,
      getValue: convertGoogleToMongoLocation,
    },
    graphql: {
      outputType: "JSON",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      onCreate: getDenormalizedFieldOnCreate<"Users">({ getValue: convertGoogleToMongoLocation, needsUpdate: userHasGoogleLocation }),
      onUpdate: getDenormalizedFieldOnUpdate<"Users">({ getValue: convertGoogleToMongoLocation, needsUpdate: userHasGoogleLocation }),
      validation: {
        optional: true,
        blackbox: true,
      },
    },
  },
  // Is the canonical value for denormalized mongoLocation and location
  // Edited from the /events page to choose where to show events near
  googleLocation: {
    database: {
      type: "JSONB",
    },
    graphql: {
      outputType: "JSON",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
        blackbox: true,
      },
    },
    form: {
      form: { stringVersionFieldName: "location" },
      order: 100,
      label: "Account location (used for location-based recommendations)",
      control: "LocationFormComponent",
      hidden: !hasEventsSetting.get(),
      group: () => formGroups.siteCustomizations,
    },
  },
  location: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  // Used to place a map marker pin on the where-are-other-users map.
  // Public.
  mapLocation: {
    database: {
      type: "JSONB",
    },
    graphql: {
      outputType: "JSON",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
        blackbox: true,
      },
    },
    form: {
      form: { variant: "grey" },
      order: isLWorAF ? 101 : 5,
      label: isLWorAF ? "Public map location" : "Location",
      control: "LocationFormComponent",
      hidden: isEAForum,
      group: () => (isLWorAF ? formGroups.siteCustomizations : formGroups.generalInfo),
    },
  },
  mapLocationLatLng: {
    graphql: {
      outputType: "LatLng",
      canRead: ["guests"],
      resolver: (user, _args, _context) => {
        const mapLocation = user.mapLocation;
        if (!mapLocation?.geometry?.location) return null;
        const { lat, lng } = mapLocation.geometry.location;
        if (typeof lat !== "number" || typeof lng !== "number") return null;
        return {
          lat,
          lng,
        };
      },
    },
  },
  mapLocationSet: {
    database: {
      type: "BOOL",
      denormalized: true,
      canAutoDenormalize: true,
      needsUpdate: userHasMapLocation,
      getValue: getMapLocationSet,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      onCreate: getDenormalizedFieldOnCreate<"Users">({ getValue: getMapLocationSet, needsUpdate: userHasMapLocation }),
      onUpdate: getDenormalizedFieldOnUpdate<"Users">({ getValue: getMapLocationSet, needsUpdate: userHasMapLocation }),
      validation: {
        optional: true,
      },
    },
  },
  mapMarkerText: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
      label: "Your text on the community map",
      control: "MuiTextField",
      order: 44,
    },
  },
  htmlMapMarkerText: {
    database: {
      type: "TEXT",
      denormalized: true,
      canAutoDenormalize: true,
      needsUpdate: userHasMapMarkerText,
      getValue: convertMapMarkerTextToHtml,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      onCreate: getDenormalizedFieldOnCreate<"Users">({ getValue: convertMapMarkerTextToHtml, needsUpdate: userHasMapMarkerText }),
      onUpdate: getDenormalizedFieldOnUpdate<"Users">({ getValue: convertMapMarkerTextToHtml, needsUpdate: userHasMapMarkerText }),
      validation: {
        optional: true,
      },
    },
  },
  nearbyEventsNotifications: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean!",
      inputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  // Should probably be merged with the other location field.
  nearbyEventsNotificationsLocation: {
    database: {
      type: "JSONB",
    },
    graphql: {
      outputType: "JSON",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
        blackbox: true,
      },
    },
    form: {
      hidden: true,
      control: "LocationFormComponent",
    },
  },
  nearbyEventsNotificationsMongoLocation: {
    database: {
      type: "JSONB",
      denormalized: true,
      canAutoDenormalize: true,
      needsUpdate: userHasNearbyEventsNotificationsLocation,
      getValue: convertNearbyEventsNotificationsToMongoLocation,
    },
    graphql: {
      outputType: "JSON",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      onCreate: getDenormalizedFieldOnCreate<"Users">({ getValue: convertNearbyEventsNotificationsToMongoLocation, needsUpdate: userHasNearbyEventsNotificationsLocation }),
      onUpdate: getDenormalizedFieldOnUpdate<"Users">({ getValue: convertNearbyEventsNotificationsToMongoLocation, needsUpdate: userHasNearbyEventsNotificationsLocation }),
      validation: {
        optional: true,
        blackbox: true,
      },
    },
  },
  nearbyEventsNotificationsRadius: {
    database: {
      type: "DOUBLE PRECISION",
    },
    graphql: {
      outputType: "Float",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
      min: 0,
      max: MAX_NOTIFICATION_RADIUS,
    },
  },
  nearbyPeopleNotificationThreshold: {
    database: {
      type: "DOUBLE PRECISION",
    },
    graphql: {
      outputType: "Float",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  hideFrontpageMap: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 44,
      label: "Hide the frontpage map",
      hidden: !isLW,
      group: () => formGroups.siteCustomizations,
    },
  },
  hideTaggingProgressBar: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
      label: "Hide the tagging progress bar",
      order: 45,
      group: () => formGroups.siteCustomizations,  
    },
  },
  // this was for the 2018 book, no longer relevant
  hideFrontpageBookAd: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
      label: "Hide the frontpage book ad",
      order: 46,
      group: () => formGroups.siteCustomizations,
    },
  },
  hideFrontpageBook2019Ad: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
      label: "Hide the frontpage book ad",
      order: 47,
      group: () => formGroups.siteCustomizations,
    },
  },
  hideFrontpageBook2020Ad: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 47,
      label: "Hide the frontpage book ad",
      hidden: !isLWorAF,
      group: () => formGroups.siteCustomizations,
    },
  },
  sunshineNotes: {
    database: {
      type: "TEXT",
      defaultValue: "",
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: ["admins", "sunshineRegiment"],
      canUpdate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      group: () => formGroups.adminOptions,
    },
  },
  sunshineFlagged: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["admins", "sunshineRegiment"],
      canUpdate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      group: () => formGroups.adminOptions,
    },
  },
  needsReview: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["admins", "sunshineRegiment"],
      canUpdate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      group: () => formGroups.adminOptions,
    },
  },
  // DEPRECATED in favor of snoozedUntilContentCount
  sunshineSnoozed: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["admins", "sunshineRegiment"],
      canUpdate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      group: () => formGroups.adminOptions,
    },
  },
  snoozedUntilContentCount: {
    database: {
      type: "DOUBLE PRECISION",
    },
    graphql: {
      outputType: "Float",
      canRead: ["admins", "sunshineRegiment"],
      canUpdate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      group: () => formGroups.adminOptions,
    },
  },
  // Set after a moderator has approved or purged a new user. NB: reviewed does
  // not imply approval, the user might have been banned
  reviewedByUserId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
    },
    graphql: {
      outputType: "String",
      canRead: ["sunshineRegiment", "admins", "guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      group: () => formGroups.adminOptions,
    },
  },
  reviewedByUser: {
    graphql: {
      outputType: "User",
      canRead: ["sunshineRegiment", "admins", "guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Users", fieldName: "reviewedByUserId" }),
    },
  },
  isReviewed: {
    graphql: {
      outputType: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      resolver: (user, args, context) => !!user.reviewedByUserId,
    },
  },
  reviewedAt: {
    database: {
      type: "TIMESTAMPTZ",
    },
    graphql: {
      outputType: "Date",
      canRead: ["admins", "sunshineRegiment"],
      canUpdate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      group: () => formGroups.adminOptions,
    },
  },
  // A number from 0 to 1, where 0 is almost certainly spam, and 1 is almost
  // certainly not-spam. This is the same scale as ReCaptcha, except that it
  // also includes post-signup activity like moderator approval, upvotes, etc.
  // Scale:
  //   0    Banned and purged user
  //   0-0.8: Unreviewed user, based on ReCaptcha rating on signup (times 0.8)
  //   0.9: Reviewed user
  //   1.0: Reviewed user with 20+ karma
  spamRiskScore: {
    graphql: {
      outputType: "Float!",
      canRead: ["guests"],
      resolver: (user, args, context) => {
        const isReviewed = !!user.reviewedByUserId;
        const { karma, signUpReCaptchaRating } = user;
        if (user.deleteContent && user.banned) return 0.0;
        else if (userIsAdmin(user)) return 1.0;
        else if (isReviewed && karma >= 20) return 1.0;
        else if (isReviewed && karma >= 0) return 0.9;
        else if (isReviewed) return 0.8;
        else if (signUpReCaptchaRating !== null && signUpReCaptchaRating !== undefined && signUpReCaptchaRating >= 0) {
          // Rescale recaptcha ratings to [0,.8]
          return signUpReCaptchaRating * 0.8;
        } else {
          // No recaptcha rating present; score it .8
          return 0.8;
        }
      },
    },
  },
  afKarma: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Float!",
      inputType: "Float",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Alignment Base Score",
    },
  },
  voteCount: {
    database: {
      type: "DOUBLE PRECISION",
      denormalized: true,
    },
    graphql: {
      outputType: "Float",
      canRead: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Small Upvote Count",
    },
  },
  smallUpvoteCount: {
    database: {
      type: "DOUBLE PRECISION",
      denormalized: true,
    },
    graphql: {
      outputType: "Float",
      canRead: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
  },
  smallDownvoteCount: {
    database: {
      type: "DOUBLE PRECISION",
      denormalized: true,
    },
    graphql: {
      outputType: "Float",
      canRead: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
  },
  bigUpvoteCount: {
    database: {
      type: "DOUBLE PRECISION",
      denormalized: true,
    },
    graphql: {
      outputType: "Float",
      canRead: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
  },
  bigDownvoteCount: {
    database: {
      type: "DOUBLE PRECISION",
      denormalized: true,
    },
    graphql: {
      outputType: "Float",
      canRead: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
  },
  voteReceivedCount: {
    database: {
      type: "DOUBLE PRECISION",
      denormalized: true,
    },
    graphql: {
      outputType: "Float",
      canRead: [userOwns, "admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
  },
  smallUpvoteReceivedCount: {
    database: {
      type: "DOUBLE PRECISION",
      denormalized: true,
    },
    graphql: {
      outputType: "Float",
      canRead: [userOwns, "admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
  },
  smallDownvoteReceivedCount: {
    database: {
      type: "DOUBLE PRECISION",
      denormalized: true,
    },
    graphql: {
      outputType: "Float",
      canRead: [userOwns, "admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
  },
  bigUpvoteReceivedCount: {
    database: {
      type: "DOUBLE PRECISION",
      denormalized: true,
    },
    graphql: {
      outputType: "Float",
      canRead: [userOwns, "admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
  },
  bigDownvoteReceivedCount: {
    database: {
      type: "DOUBLE PRECISION",
      denormalized: true,
    },
    graphql: {
      outputType: "Float",
      canRead: [userOwns, "admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
  },
  usersContactedBeforeReview: {
    database: {
      type: "TEXT[]",
    },
    graphql: {
      outputType: "[String!]",
      inputType: "[String!]",
      canRead: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
  },
  // Full Name field to display full name for alignment forum users
  fullName: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 39,
      hidden: !isLWorAF,
      group: () => formGroups.default,
    },
  },
  shortformFeedId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Posts",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Quick takes feed ID",
      group: () => formGroups.adminOptions,
    },
  },
  shortformFeed: {
    graphql: {
      outputType: "Post",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Posts", fieldName: "shortformFeedId" }),
    },
  },
  viewUnreviewedComments: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 0,
      group: () => formGroups.adminOptions,
    },
  },
  partiallyReadSequences: {
    database: {
      type: "JSONB[]",
    },
    graphql: {
      outputType: "[JSON!]",
      inputType: "[JSON!]",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns],
      validation: {
        simpleSchema: [partiallyReadSequenceItem],
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  beta: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 70,
      label: "Opt into experimental (beta) features",
      tooltip: "Get early access to new in-development features",
      group: () => formGroups.siteCustomizations,
    },
  },
  reviewVotesQuadratic: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  reviewVotesQuadratic2019: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  reviewVoteCount: {
    graphql: {
      outputType: "Int",
      canRead: ["admins", "sunshineRegiment"],
      resolver: async (document, args, context) => {
        const { ReviewVotes } = context;
        const voteCount = await ReviewVotes.find({
          userId: document._id,
          year: REVIEW_YEAR + "",
        }).count();
        return voteCount;
      },
    },
  },
  reviewVotesQuadratic2020: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  petrovPressedButtonDate: {
    database: {
      type: "TIMESTAMPTZ",
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
      control: "datetime",
      group: () => formGroups.adminOptions,
    },
  },
  petrovLaunchCodeDate: {
    database: {
      type: "TIMESTAMPTZ",
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
      control: "datetime",
      group: () => formGroups.adminOptions,
    },
  },
  defaultToCKEditor: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Activate CKEditor by default",
      group: () => formGroups.adminOptions,
    },
  },
  // ReCaptcha v3 Integration
  // From 0 to 1. Lower is spammier, higher is humaner.
  signUpReCaptchaRating: {
    database: {
      type: "DOUBLE PRECISION",
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      tooltip: "Edit this number to '1' if you're confiden they're not a spammer",
      group: () => formGroups.adminOptions,
    },
  },
  noExpandUnreadCommentsReview: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean!",
      inputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  postCount: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      denormalized: true,
      canAutoDenormalize: true,
      canAutofillDefault: true,
      getValue: getDenormalizedCountOfReferencesGetValue({
        collectionName: "Users",
        fieldName: "postCount",
        foreignCollectionName: "Posts",
        foreignFieldName: "userId",
        filterFn: (post) => !post.draft && !post.rejected && post.status === postStatuses.STATUS_APPROVED,
      }),
      nullable: false,
    },
    graphql: {
      outputType: "Float!",
      inputType: "Float",
      canRead: ["guests"],
      onCreate: () => 0,
      countOfReferences: {
        foreignCollectionName: "Posts",
        foreignFieldName: "userId",
        filterFn: (post) => !post.draft && !post.rejected && post.status === postStatuses.STATUS_APPROVED,
        resyncElastic: false,
      },
      validation: {
        optional: true,
      },
    },
  },
  maxPostCount: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      denormalized: true,
      canAutoDenormalize: true,
      canAutofillDefault: true,
      getValue: getDenormalizedCountOfReferencesGetValue({
        collectionName: "Users",
        fieldName: "maxPostCount",
        foreignCollectionName: "Posts",
        foreignFieldName: "userId",
        filterFn: (doc) => true,
      }),
      nullable: false,
    },
    graphql: {
      outputType: "Float!",
      inputType: "Float",
      canRead: ["guests"],
      countOfReferences: {
        foreignCollectionName: "Posts",
        foreignFieldName: "userId",
        filterFn: (doc) => true,
        resyncElastic: false,
      },
      validation: {
        optional: true,
      },
    },
  },
  posts: {
    graphql: {
      outputType: "[Post]",
      canRead: ["guests"],
      arguments: "limit: Int = 5",
      resolver: async (user, args: { limit: number }, context) => {
        const { limit } = args;
        const { currentUser, Posts } = context;
        const posts = await Posts.find(
          {
            userId: user._id,
          },
          {
            limit,
          }
        ).fetch();
        return await accessFilterMultiple(currentUser, "Posts", posts, context);
      },
    },
  },
  commentCount: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      denormalized: true,
      canAutoDenormalize: true,
      canAutofillDefault: true,
      getValue: getDenormalizedCountOfReferencesGetValue({
        collectionName: "Users",
        fieldName: "commentCount",
        foreignCollectionName: "Comments",
        foreignFieldName: "userId",
        filterFn: (comment) => !comment.deleted && !comment.rejected,
      }),
      nullable: false,
    },
    graphql: {
      outputType: "Float!",
      inputType: "Float",
      canRead: ["guests"],
      onCreate: () => 0,
      countOfReferences: {
        foreignCollectionName: "Comments",
        foreignFieldName: "userId",
        filterFn: (comment) => !comment.deleted && !comment.rejected,
        resyncElastic: true,
      },
      validation: {
        optional: true,
      },
    },
  },
  maxCommentCount: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      denormalized: true,
      canAutoDenormalize: true,
      canAutofillDefault: true,
      getValue: getDenormalizedCountOfReferencesGetValue({
        collectionName: "Users",
        fieldName: "maxCommentCount",
        foreignCollectionName: "Comments",
        foreignFieldName: "userId",
        filterFn: (doc) => true,
      }),
      nullable: false,
    },
    graphql: {
      outputType: "Float!",
      inputType: "Float",
      canRead: ["guests"],
      countOfReferences: {
        foreignCollectionName: "Comments",
        foreignFieldName: "userId",
        filterFn: (doc) => true,
        resyncElastic: false,
      },
      validation: {
        optional: true,
      },
    },
  },
  tagRevisionCount: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      denormalized: true,
      canAutoDenormalize: true,
      canAutofillDefault: true,
      getValue: getDenormalizedCountOfReferencesGetValue({
        collectionName: "Users",
        fieldName: "tagRevisionCount",
        foreignCollectionName: "Revisions",
        foreignFieldName: "userId",
        filterFn: (revision) => revision.collectionName === "Tags",
      }),
      nullable: false,
    },
    graphql: {
      outputType: "Float!",
      inputType: "Float",
      canRead: ["guests"],
      onCreate: () => 0,
      countOfReferences: {
        foreignCollectionName: "Revisions",
        foreignFieldName: "userId",
        filterFn: (revision) => revision.collectionName === "Tags",
        resyncElastic: false,
      },
      validation: {
        optional: true,
      },
    },
  },
  abTestKey: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: ["admins"],
      onCreate: ({ document, context }) => {
        return getUserABTestKey({
          clientId: context.clientId ?? randomId(),
        });
      },
      validation: {
        optional: true,
      },
    },
    form: {
      group: () => formGroups.adminOptions,
    },
  },
  abTestOverrides: {
    database: {
      type: "JSONB", // Record<string,number>
    },
    graphql: {
      outputType: GraphQLJSON,
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      validation: {
        optional: true,
        blackbox: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  // This is deprecated.
  reenableDraftJs: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 73,
      label: "Restore the previous WYSIWYG editor",
      tooltip: "Restore the old Draft-JS based editor",
      hidden: !isEAForum,
      group: () => formGroups.siteCustomizations,
    },
  },
  walledGardenInvite: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: !isLWorAF,
      group: () => formGroups.adminOptions,
    },
  },
  hideWalledGardenUI: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: !isLWorAF,
      group: () => formGroups.siteCustomizations,
    },
  },
  walledGardenPortalOnboarded: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  taggingDashboardCollapsed: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  usernameUnset: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["members"],
      canUpdate: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  paymentEmail: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Payment Contact Email",
      tooltip: "An email you'll definitely check where you can receive information about receiving payments",
      hidden: !isLWorAF,
      group: () => formGroups.paymentInfo,
    },
  },
  paymentInfo: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "PayPal Info",
      tooltip: "Your PayPal account info, for sending small payments",
      hidden: !isLWorAF,
      group: () => formGroups.paymentInfo,
    },
  },
  profileUpdatedAt: {
    database: {
      type: "TIMESTAMPTZ",
      defaultValue: new Date(0),
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Date!",
      inputType: "Date",
      canRead: ["guests"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members"],
    },
    form: {
      hidden: true,
    },
  },
  // Cloudinary image id for the profile image (high resolution)
  profileImageId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
      order: isLWorAF ? 40 : 1,
      group: () => formGroups.default,
      label: "Profile Image",
      control: "ImageUpload",
      form: {
        horizontal: true,
      },
    },
  },
  jobTitle: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
      control: "FormComponentFriendlyTextInput",
      group: () => formGroups.generalInfo,
      order: 2,
      label: 'Role',
    },
  },
  organization: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
      control: "FormComponentFriendlyTextInput",
      group: () => formGroups.generalInfo,
      order: 3,
    },
  },
  careerStage: {
    database: {
      type: "TEXT[]",
    },
    graphql: {
      outputType: "[String!]",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
      control: "FormComponentMultiSelect",
      group: () => formGroups.generalInfo,
      order: 4,
      label: "Career stage",
      placeholder: 'Select all that apply',
      form: {
        variant: "grey",
        separator: ", ",
        options: CAREER_STAGES,
      },
    },
  },
  website: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
      control: "PrefixedInput",
      group: () => formGroups.socialMedia,
      order: 6,
      form: {
        inputPrefix: 'https://',
        heading: "Website",
      },
    },
  },
  bio: {
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      resolver: (user, args, { Users }) => {
        const bio = user.biography?.originalContents;
        if (!bio) return "";
        return dataToMarkdown(bio.data, bio.type);
      },
    },
  },
  htmlBio: {
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
      resolver: (user, args, { Users }) => {
        const bio = user.biography;
        return bio?.html || "";
      },
    },
  },
  fmCrosspostUserId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  linkedinProfileURL: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
      control: "PrefixedInput",
      group: () => formGroups.socialMedia,
      order: 1,
      form: {
        inputPrefix: () => SOCIAL_MEDIA_PROFILE_FIELDS.linkedinProfileURL,
        heading: "Social media",
        smallBottomMargin: true,
      },
    },
  },
  facebookProfileURL: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
      control: "PrefixedInput",
      group: () => formGroups.socialMedia,
      order: 2,
      form: {
        inputPrefix: () => SOCIAL_MEDIA_PROFILE_FIELDS.facebookProfileURL,
        smallBottomMargin: true,
      },
    },
  },
  blueskyProfileURL: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
      control: "PrefixedInput",
      group: () => formGroups.socialMedia,
      order: 3,
      form: {
        inputPrefix: () => SOCIAL_MEDIA_PROFILE_FIELDS.blueskyProfileURL,
        smallBottomMargin: true,
      },
    },
  },
  /**
   * Twitter profile URL that the user can set in their public profile. "URL" is a bit of a misnomer here,
   * if entered correctly this will be *just* the handle (e.g. "eaforumposts" for the account at https://twitter.com/eaforumposts)
   */
  twitterProfileURL: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
      control: "PrefixedInput",
      group: () => formGroups.socialMedia,
      order: 4,
      form: {
        inputPrefix: () => SOCIAL_MEDIA_PROFILE_FIELDS.twitterProfileURL,
        smallBottomMargin: true,
      },
    },
  },
  /**
   * Twitter profile URL that can only be set by mods/admins. for when a more reliable reference is needed than
   * what the user enters themselves (e.g. for tagging authors from the EA Forum twitter account)
   */
  twitterProfileURLAdmin: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["sunshineRegiment", "admins"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      form: {
        inputPrefix: () => SOCIAL_MEDIA_PROFILE_FIELDS.twitterProfileURL,
        heading: "Social media (private, for admin use)",
        smallBottomMargin: false,
      },
      order: 11,
      control: "PrefixedInput",
      hidden: !isEAForum,
      group: () => formGroups.adminOptions,
    },
  },
  githubProfileURL: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
      control: "PrefixedInput",
      group: () => formGroups.socialMedia,
      order: 4,
      form: {
        inputPrefix: () => SOCIAL_MEDIA_PROFILE_FIELDS.githubProfileURL,
      },
    },
  },
  profileTagIds: {
    database: {
      type: "VARCHAR(27)[]",
      defaultValue: [],
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "[String!]!",
      inputType: "[String!]",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      onCreate: arrayOfForeignKeysOnCreate,
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
      group: () => formGroups.aboutMe,
      order: 100,
      control: "TagMultiselect",
      form: {
        variant: "grey",
      },
      label: "Interests",
      placeholder: `Search for ${taggingNamePluralSetting.get()}`
    },
  },
  profileTags: {
    graphql: {
      outputType: "[Tag!]!",
      canRead: ["guests"],
      resolver: generateIdResolverMulti({ foreignCollectionName: "Tags", fieldName: "profileTagIds" }),
    },
  },
  // These are the groups displayed in the user's profile (i.e. this field is informational only).
  // This does NOT affect permissions - use the organizerIds field on localgroups for that.
  organizerOfGroupIds: {
    database: {
      type: "VARCHAR(27)[]",
      defaultValue: [],
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "[String!]!",
      inputType: "[String!]",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      onCreate: arrayOfForeignKeysOnCreate,
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
      group: () => formGroups.activity,
      order: 2,
      control: "SelectLocalgroup",
      label: "Organizer of",
      placeholder: 'Select groups to display',
      tooltip: "If you organize a group that is missing from this list, please contact the EA Forum team.",
      form: {
        useDocumentAsUser: true,
        variant: "grey",
        separator: ", ",
        multiselect: true,
        hideClear: true,
      },
    },
  },
  organizerOfGroups: {
    graphql: {
      outputType: "[Localgroup!]!",
      canRead: ["guests"],
      resolver: generateIdResolverMulti({ foreignCollectionName: "Localgroups", fieldName: "organizerOfGroupIds" }),
    },
  },
  programParticipation: {
    database: {
      type: "TEXT[]",
    },
    graphql: {
      outputType: "[String!]",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
      group: () => formGroups.activity,
      order: 3,  
      control: "FormComponentMultiSelect",
      placeholder: "Which of these programs have you participated in?",
      form: {
        variant: "grey",
        separator: ", ",
        options: () => PROGRAM_PARTICIPATION
      },
    },
  },
  postingDisabled: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["members"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 69,
      control: "checkbox",
      group: () => formGroups.disabledPrivileges,
    },
  },
  allCommentingDisabled: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["members"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 70,
      control: "checkbox",
      group: () => formGroups.disabledPrivileges,
    },
  },
  commentingOnOtherUsersDisabled: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["members"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 71,
      control: "checkbox",
      group: () => formGroups.disabledPrivileges,
    },
  },
  conversationsDisabled: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["members"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 72,
      control: "checkbox",
      group: () => formGroups.disabledPrivileges,
    },
  },
  associatedClientId: {
    graphql: {
      outputType: "ClientId",
      canRead: ["sunshineRegiment", "admins"],
      resolver: async (user, args, context) => {
        return await context.ClientIds.findOne(
          {
            userIds: user._id,
          },
          {
            sort: {
              createdAt: -1,
            },
          }
        );
      },
    },
  },
  associatedClientIds: {
    graphql: {
      outputType: "[ClientId!]",
      canRead: ["sunshineRegiment", "admins"],
      resolver: async (user, args, context) => {
        return await context.ClientIds.find(
          {
            userIds: user._id,
          },
          {
            sort: {
              createdAt: -1,
            },
            limit: 100,
          }
        ).fetch();
      },
    },
  },
  altAccountsDetected: {
    graphql: {
      outputType: "Boolean",
      canRead: ["sunshineRegiment", "admins"],
      resolver: async (user, args, context) => {
        const clientIds = await context.ClientIds.find(
          {
            userIds: user._id,
          },
          {
            sort: {
              createdAt: -1,
            },
            limit: 100,
          }
        ).fetch();
        const userIds = new Set();
        for (let clientId of clientIds) {
          for (let userId of clientId.userIds ?? []) userIds.add(userId);
        }
        return userIds.size > 1;
      },
    },
  },
  acknowledgedNewUserGuidelines: {
    database: {
      type: "BOOL",
      nullable: true,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  moderatorActions: {
    graphql: {
      outputType: "[ModeratorAction]",
      canRead: ["sunshineRegiment", "admins"],
      resolver: async (doc, args, context) => {
        const { ModeratorActions, loaders } = context;
        return ModeratorActions.find({
          userId: doc._id,
        }).fetch();
      },
    },
  },
  subforumPreferredLayout: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"], // only editable by changing the setting from the subforum page
      canCreate: ["members", "admins"],
      validation: {
        allowedValues: ["card", "list"],
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  // used by the EA Forum to track when a user has dismissed the frontpage job ad
  hideJobAdUntil: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      outputType: "Date",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  // used by the EA Forum to track if a user has dismissed the post page criticism tips card
  criticismTipsDismissed: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  hideFromPeopleDirectory: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean!",
      inputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Hide my profile from the People directory",
      hidden: !isEAForum,
      group: () => formGroups.privacy,
    },
  },
  allowDatadogSessionReplay: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean!",
      inputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Allow Session Replay",
      tooltip: "Allow us to capture a video-like recording of your browser session (using Datadog Session Replay) — this is useful for debugging and improving the site.",
      hidden: !isEAForum,
      group: () => formGroups.privacy,
    },
  },
  afPostCount: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      denormalized: true,
      canAutoDenormalize: true,
      canAutofillDefault: true,
      getValue: getDenormalizedCountOfReferencesGetValue({
        collectionName: "Users",
        fieldName: "afPostCount",
        foreignCollectionName: "Posts",
        foreignFieldName: "userId",
        filterFn: (post) => post.af && !post.draft && post.status === postStatuses.STATUS_APPROVED,
      }),
      nullable: false,
    },
    graphql: {
      outputType: "Float!",
      inputType: "Float",
      canRead: ["guests"],
      onCreate: () => 0,
      countOfReferences: {
        foreignCollectionName: "Posts",
        foreignFieldName: "userId",
        filterFn: (post) => post.af && !post.draft && post.status === postStatuses.STATUS_APPROVED,
        resyncElastic: false,
      },
      validation: {
        optional: true,
      },
    },
  },
  afCommentCount: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      denormalized: true,
      canAutoDenormalize: true,
      canAutofillDefault: true,
      getValue: getDenormalizedCountOfReferencesGetValue({
        collectionName: "Users",
        fieldName: "afCommentCount",
        foreignCollectionName: "Comments",
        foreignFieldName: "userId",
        filterFn: (comment) => comment.af,
      }),
      nullable: false,
    },
    graphql: {
      outputType: "Float!",
      inputType: "Float",
      canRead: ["guests"],
      onCreate: () => 0,
      countOfReferences: {
        foreignCollectionName: "Comments",
        foreignFieldName: "userId",
        filterFn: (comment) => comment.af,
        resyncElastic: false,
      },
      validation: {
        optional: true,
      },
    },
  },
  afSequenceCount: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      denormalized: true,
      canAutoDenormalize: true,
      canAutofillDefault: true,
      getValue: getDenormalizedCountOfReferencesGetValue({
        collectionName: "Users",
        fieldName: "afSequenceCount",
        foreignCollectionName: "Sequences",
        foreignFieldName: "userId",
        filterFn: (sequence) => sequence.af && !sequence.draft && !sequence.isDeleted,
      }),
      nullable: false,
    },
    graphql: {
      outputType: "Float!",
      inputType: "Float",
      canRead: ["guests"],
      onCreate: () => 0,
      countOfReferences: {
        foreignCollectionName: "Sequences",
        foreignFieldName: "userId",
        filterFn: (sequence) => sequence.af && !sequence.draft && !sequence.isDeleted,
        resyncElastic: false,
      },
      validation: {
        optional: true,
      },
    },
  },
  afSequenceDraftCount: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      denormalized: true,
      canAutoDenormalize: true,
      canAutofillDefault: true,
      getValue: getDenormalizedCountOfReferencesGetValue({
        collectionName: "Users",
        fieldName: "afSequenceDraftCount",
        foreignCollectionName: "Sequences",
        foreignFieldName: "userId",
        filterFn: (sequence) => sequence.af && sequence.draft && !sequence.isDeleted,
      }),
      nullable: false,
    },
    graphql: {
      outputType: "Float!",
      inputType: "Float",
      canRead: ["guests"],
      onCreate: () => 0,
      countOfReferences: {
        foreignCollectionName: "Sequences",
        foreignFieldName: "userId",
        filterFn: (sequence) => sequence.af && sequence.draft && !sequence.isDeleted,
        resyncElastic: false,
      },
      validation: {
        optional: true,
      },
    },
  },
  reviewForAlignmentForumUserId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["alignmentForumAdmins", "admins"],
      canCreate: ["alignmentForumAdmins", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "AF Review UserId",
      hidden: !isLWorAF,
      group: () => formGroups.adminOptions,
    },
  },
  afApplicationText: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: [userOwns, "alignmentForumAdmins", "admins"],
      canUpdate: [userOwns, "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  afSubmittedApplication: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: [userOwns, "alignmentForumAdmins", "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  rateLimitNextAbleToComment: {
    graphql: {
      outputType: "JSON",
      canRead: ["guests"],
      arguments: "postId: String",
      resolver: async (user, args, context) => {
        return rateLimitDateWhenUserNextAbleToComment(user, args.postId, context);
      },
    },
  },
  rateLimitNextAbleToPost: {
    graphql: {
      outputType: "JSON",
      canRead: ["guests"],
      arguments: "eventForm: Boolean",
      resolver: async (user, args, context) => {
        const { eventForm } = args;
        if (eventForm) return null;
        const rateLimit = await rateLimitDateWhenUserNextAbleToPost(user, context);
        if (rateLimit) {
          return rateLimit;
        } else {
          return null;
        }
      },
    },
  },
  recentKarmaInfo: {
    graphql: {
      outputType: "JSON",
      canRead: ["guests"],
      resolver: async (user, args, context) => {
        return getRecentKarmaInfo(user._id, context);
      },
    },
  },
  hideSunshineSidebar: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Hide Sunshine Sidebar",
      hidden: isEAForum,
      group: () => formGroups.adminOptions,
    },
  },
  // EA Forum emails the user a survey if they haven't read a post in 4 months
  inactiveSurveyEmailSentAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      outputType: "Date",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  // Used by EAF to track when we last emailed the user about the annual user survey
  userSurveyEmailSentAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      outputType: "Date",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  karmaChanges: {
    graphql: {
      outputType: "KarmaChanges",
      canRead: userOwns,
      arguments: "startDate: Date, endDate: Date",
      resolver: async (document, { startDate, endDate }, context) => {
        const { currentUser, Users } = context;
        if (!currentUser) return null;
        // If this isn't an SSR (ie, it might be a mutation), refetch the current
        // user, because the current user gets set at the beginning of the request,
        // which matters if we're refetching this because we just updated
        // karmaChangeLastOpened.
        const newCurrentUser = context.isSSR ? currentUser : await Users.findOne(currentUser._id);
        if (!newCurrentUser) throw Error(`Cant find user with ID: ${currentUser._id}`);
        const settings = newCurrentUser.karmaChangeNotifierSettings;
        const now = new Date();
        // If date range isn't specified, infer it from user settings
        if (!startDate || !endDate) {
          // If the user has karmaChanges disabled, don't return anything
          if (settings.updateFrequency === "disabled") return null;
          const lastOpened = newCurrentUser.karmaChangeLastOpened;
          const lastBatchStart = newCurrentUser.karmaChangeBatchStart;
          const dateRange = getKarmaChangeDateRange({
            settings,
            lastOpened,
            lastBatchStart,
            now,
          });
          if (dateRange == null) return null;
          const { start, end } = dateRange;
          startDate = start;
          endDate = end;
        }
        const nextBatchDate = getKarmaChangeNextBatchDate({
          settings,
          now,
        });
        return getKarmaChanges({
          user: document,
          startDate,
          endDate,
          nextBatchDate,
          af: isAF,
          context,
        });
      },
    },
  },
  // Admin-only options for configuring Recommendations placement, for experimentation
  recommendationSettings: {
    database: {
      type: "JSONB",
    },
    graphql: {
      outputType: "JSON",
      canRead: [userOwns],
      canUpdate: [userOwns],
      validation: {
        simpleSchema: recommendationSettingsSchema,
        optional: true,
        blackbox: true,
      },
    },
    form: {
      hidden: true,
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"Users">>;

export default schema;
