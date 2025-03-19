// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import SimpleSchema from "simpl-schema";
import {
  userGetProfileUrl,
  getUserEmail,
  userOwnsAndInGroup, getAuth0Provider,
  SOCIAL_MEDIA_PROFILE_FIELDS
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
  googleLocationToMongoLocation, schemaDefaultValue
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
  hasPostRecommendations,
  hasSurveys,
  userCanViewJargonTerms
} from "../../betas";
import { TupleSet, UnionOf } from "../../utils/typeGuardUtils";
import { randomId } from "../../random";
import { getUserABTestKey } from "../../abTestImpl";
import { DeferredForumSelect } from "../../forumTypeUtils";
import { getNestedProperty } from "../../vulcan-lib/utils";
import { addGraphQLSchema } from "../../vulcan-lib/graphql";
import { defaultEditorPlaceholder, getDefaultLocalStorageIdGenerator, getDenormalizedEditableResolver, getRevisionsResolver, getVersionResolver } from "@/lib/editor/make_editable";
import { recommendationSettingsSchema } from "@/lib/collections/users/recommendationSettings";
import { markdownToHtml, dataToMarkdown } from "@/server/editor/conversionUtils";
import { getKarmaChangeDateRange, getKarmaChangeNextBatchDate, getKarmaChanges } from "@/server/karmaChanges";
import { rateLimitDateWhenUserNextAbleToComment, rateLimitDateWhenUserNextAbleToPost, getRecentKarmaInfo } from "@/server/rateLimitUtils";
import { isFriendlyUI } from "@/themes/forumTheme";

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

export const createDisplayName = (user: DbInsertion<DbUser>): string => {
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

export type NotificationChannelOption = "none" | "onsite" | "email" | "both";
export type NotificationBatchingOption = "realtime" | "daily" | "weekly";

export type NotificationTypeSettings = {
  channel: NotificationChannelOption;
  batchingFrequency: NotificationBatchingOption;
  timeOfDayGMT: number;
  dayOfWeekGMT: string; // "Monday"|"Tuesday"|"Wednesday"|"Thursday"|"Friday"|"Saturday"|"Sunday",
};

export const defaultNotificationTypeSettings: NotificationTypeSettings = {
  channel: "onsite",
  batchingFrequency: "realtime",
  timeOfDayGMT: 12,
  dayOfWeekGMT: "Monday",
};

export const multiChannelDefaultNotificationTypeSettings: NotificationTypeSettings = {
  channel: "both",
  batchingFrequency: "realtime",
  timeOfDayGMT: 12,
  dayOfWeekGMT: "Monday",
};

const rateLimitInfoSchema = new SimpleSchema({
  nextEligible: {
    type: Date,
  },
  rateLimitType: {
    type: String,
    allowedValues: ["moderator", "lowKarma", "universal", "downvoteRatio"],
  },
  rateLimitMessage: {
    type: String,
  },
});

const karmaChangeUpdateFrequencies = new TupleSet(["disabled", "daily", "weekly", "realtime"] as const);

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

const notificationTypeSettings = new SimpleSchema({
  channel: {
    type: String,
    allowedValues: ["none", "onsite", "email", "both"],
  },
  batchingFrequency: {
    type: String,
    allowedValues: ["realtime", "daily", "weekly"],
  },
  timeOfDayGMT: {
    type: Number,
    optional: true,
  },
  dayOfWeekGMT: {
    type: String,
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

const notificationTypeSettingsField = (overrideSettings?: Partial<NotificationTypeSettings>) => ({
  type: notificationTypeSettings,
  optional: true,
  group: () => formGroups.notifications,
  control: "NotificationTypeSettingsWidget" as const,
  canRead: [userOwns, "admins"] as FieldPermissions,
  canUpdate: [userOwns, "admins"] as FieldPermissions,
  canCreate: ["members", "admins"] as FieldCreatePermissions,
  ...schemaDefaultValue<"Users">({ ...defaultNotificationTypeSettings, ...overrideSettings }),
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

const latLng = new SimpleSchema({
  lat: {
    type: Number,
  },
  lng: {
    type: Number,
  },
});
addGraphQLSchema(`
  type LatLng {
    lat: Float!
    lng: Float!
  }
`);

/**
 * @summary Users schema
 * @type {Object}
 */

const hmGinK = (data) => "googleLocation" in data;
const hjtvjR = async (user) => {
  if (user.googleLocation) return googleLocationToMongoLocation(user.googleLocation);
  return null;
};
const hCSYZF = (data) => "mapLocation" in data;
const h7EQ3h = async (user) => {
  return !!user.mapLocation;
};
const hhMzyC = (data) => "mapMarkerText" in data;
const h2Ewjc = async (user) => {
  if (!user.mapMarkerText) return "";
  return await markdownToHtml(user.mapMarkerText);
};
const hTcEov = (data) => "nearbyEventsNotificationsLocation" in data;
const heeJHD = async (user) => {
  if (user.nearbyEventsNotificationsLocation)
    return googleLocationToMongoLocation(user.nearbyEventsNotificationsLocation);
};

const schema = {
  _id: {
    database: {
      type: "VARCHAR(27)",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  schemaVersion: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 1,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      onUpdate: () => 1,
      validation: {
        optional: true,
      },
    },
  },
  createdAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      onCreate: () => new Date(),
      validation: {
        optional: true,
      },
    },
  },
  legacyData: {
    database: {
      type: "JSONB",
      nullable: true,
    },
    graphql: {
      outputType: "JSON",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  moderationGuidelines: {
    graphql: {
      outputType: "Revision",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      editableFieldOptions: { pingbacks: false, normalized: false },
      arguments: "version: String",
      resolver: getDenormalizedEditableResolver("Users", "moderationGuidelines"),
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
      hidden: isFriendlyUI,
      group: () => formGroups.moderationGroup,
      editableFieldOptions: {
        getLocalStorageId: getDefaultLocalStorageIdGenerator("Users"),
        revisionsHaveCommitMessages: false,
      },
    },
  },
  moderationGuidelines_latest: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  moderationGuidelinesRevisions: {
    graphql: {
      outputType: "[Revision]",
      canRead: ["guests"],
      arguments: "limit: Int = 5",
      resolver: getRevisionsResolver("moderationGuidelinesRevisions"),
    },
  },
  moderationGuidelinesVersion: {
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      resolver: getVersionResolver("moderationGuidelinesVersion"),
    },
  },
  howOthersCanHelpMe: {
    graphql: {
      outputType: "Revision",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      editableFieldOptions: { pingbacks: false, normalized: false },
      arguments: "version: String",
      resolver: getDenormalizedEditableResolver("Users", "howOthersCanHelpMe"),
    },
    form: {
      hidden: true,
      order: 7,
      label: "How others can help me",
      group: () => formGroups.aboutMe,
      form: {
        hintText: () => "Ex: I am looking for opportunities to do...",
        formVariant: isFriendlyUI ? "grey" : undefined,
        commentEditor: true,
        commentStyles: true,
      }
    },
  },
  howOthersCanHelpMe_latest: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  howOthersCanHelpMeRevisions: {
    graphql: {
      outputType: "[Revision]",
      canRead: ["guests"],
      arguments: "limit: Int = 5",
      resolver: getRevisionsResolver("howOthersCanHelpMeRevisions"),
    },
  },
  howOthersCanHelpMeVersion: {
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      resolver: getVersionResolver("howOthersCanHelpMeVersion"),
    },
  },
  howICanHelpOthers: {
    graphql: {
      outputType: "Revision",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      editableFieldOptions: { pingbacks: false, normalized: false },
      arguments: "version: String",
      resolver: getDenormalizedEditableResolver("Users", "howICanHelpOthers"),
    },
    form: {
      hidden: true,
      order: 8,
      label: "How I can help others",
      group: () => formGroups.aboutMe,
      form: {
        hintText: () => "Ex: Reach out to me if you have questions about...",
        formVariant: isFriendlyUI ? "grey" : undefined,
        commentEditor: true,
        commentStyles: true,
      }
    },
  },
  howICanHelpOthers_latest: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  howICanHelpOthersRevisions: {
    graphql: {
      outputType: "[Revision]",
      canRead: ["guests"],
      arguments: "limit: Int = 5",
      resolver: getRevisionsResolver("howICanHelpOthersRevisions"),
    },
  },
  howICanHelpOthersVersion: {
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      resolver: getVersionResolver("howICanHelpOthersVersion"),
    },
  },
  slug: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
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
      outputType: "[String]",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  biography: {
    graphql: {
      outputType: "Revision",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      editableFieldOptions: { pingbacks: false, normalized: false },
      arguments: "version: String",
      resolver: getDenormalizedEditableResolver("Users", "biography"),
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
  biography_latest: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  biographyRevisions: {
    graphql: {
      outputType: "[Revision]",
      canRead: ["guests"],
      arguments: "limit: Int = 5",
      resolver: getRevisionsResolver("biographyRevisions"),
    },
  },
  biographyVersion: {
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      resolver: getVersionResolver("biographyVersion"),
    },
  },
  username: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["members"],
      onCreate: ({ document: user }) => {
        if (!user.username && user.services?.twitter?.screenName) {
          return user.services.twitter.screenName;
        }
      },
      validation: {
        optional: true,
      },
    },
  },
  emails: {
    database: {
      type: "JSONB[]",
    },
    graphql: {
      outputType: "[JSON]",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      onCreate: ({ document: user }) => {
        const oAuthEmail =
          getNestedProperty(user, "services.facebook.email") |
          getNestedProperty(user, "services.google.email") |
          getNestedProperty(user, "services.github.email") |
          getNestedProperty(user, "services.linkedin.emailAddress");
        if (oAuthEmail) {
          return [
            {
              address: oAuthEmail,
              verified: true,
            },
          ];
        }
      },
      validation: {
        optional: true,
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
      outputType: "Boolean",
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
  profile: {
    database: {
      type: "JSONB",
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
  hasAuth0Id: {
    graphql: {
      outputType: "Boolean",
      canRead: [userOwns, "admins"],
      resolver: (user) => {
        return getAuth0Provider(user) === "auth0";
      },
    },
  },
  displayName: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
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
      group: () => formGroups.default,
    },
  },
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
        const { data, document, oldDocument } = props;
        if (oldDocument.email?.length && !document.email) {
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
      form: { disabled: ({ document }) => isEAForum && !document.hasAuth0Id },
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
      outputType: "Boolean",
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
      outputType: "[String]",
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
  },
  whenConfirmationEmailSent: {
    database: {
      type: "TIMESTAMPTZ",
    },
    graphql: {
      outputType: "Date",
      canRead: ["members"],
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
  hideIntercom: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
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
      order: 71,
      label: "Hide Intercom",
      control: "checkbox",
      group: () => formGroups.siteCustomizations,
    },
  },
  markDownPostEditor: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
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
  },
  noSingleLineComments: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
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
      outputType: "Boolean",
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
      outputType: "Boolean",
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
      outputType: "Boolean",
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
  },
  showCommunityInRecentDiscussion: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
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
      outputType: "Boolean",
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
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
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
      validation: {
        optional: true,
        blackbox: true,
      },
    },
  },
  hideFrontpageFilterSettingsDesktop: {
    database: {
      type: "BOOL",
      nullable: true,
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
  },
  karma: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Float",
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
  bannedUserIds: {
    database: {
      type: "VARCHAR(27)[]",
    },
    graphql: {
      outputType: "[String]",
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
  bannedPersonalUserIds: {
    database: {
      type: "VARCHAR(27)[]",
    },
    graphql: {
      outputType: "[String]",
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
      outputType: "[JSON]",
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
      },
    },
  },
  bookmarkedPosts: {
    graphql: {
      outputType: "[Post!]!",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      resolver: generateIdResolverMulti({
        foreignCollectionName: "Posts",
        fieldName: "bookmarkedPostsMetadata",
        getKey: (obj) => obj.postId,
      }),
    },
  },
  hiddenPostsMetadata: {
    database: {
      type: "JSONB[]",
      defaultValue: [],
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "[JSON]",
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
      },
    },
  },
  hiddenPosts: {
    graphql: {
      outputType: "[Post!]!",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      resolver: generateIdResolverMulti({ foreignCollectionName: "Posts", fieldName: "hiddenPostsMetadata" }),
    },
  },
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
  },
  deleted: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
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
  },
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
      outputType: "Boolean",
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
      outputType: "Boolean",
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
      outputType: "Boolean",
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
      outputType: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      validation: {
        simpleSchema: notificationTypeSettings,
        optional: true,
      },
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
      outputType: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      validation: {
        simpleSchema: notificationTypeSettings,
        optional: true,
      },
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
      outputType: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      validation: {
        simpleSchema: notificationTypeSettings,
        optional: true,
      },
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
      outputType: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      validation: {
        simpleSchema: notificationTypeSettings,
        optional: true,
      },
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
      outputType: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      onCreate: () => {
        if (!isLWorAF) {
          return {
            ...defaultNotificationTypeSettings,
            channel: "both",
          };
        }
      },
      validation: {
        simpleSchema: notificationTypeSettings,
        optional: true,
      },
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
      outputType: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      validation: {
        simpleSchema: notificationTypeSettings,
        optional: true,
      },
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
      defaultValue: { channel: "both", batchingFrequency: "realtime", timeOfDayGMT: 12, dayOfWeekGMT: "Monday" },
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      validation: {
        simpleSchema: notificationTypeSettings,
        optional: true,
      },
    },
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
    graphql: {
      outputType: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      validation: {
        simpleSchema: notificationTypeSettings,
        optional: true,
      },
    },
    form: {
      label: "Posts added to tags I'm subscribed to",
      control: "NotificationTypeSettingsWidget",
      group: () => formGroups.notifications,
    },
  },
  notificationSubscribedSequencePost: {
    database: {
      type: "JSONB",
      defaultValue: { channel: "both", batchingFrequency: "realtime", timeOfDayGMT: 12, dayOfWeekGMT: "Monday" },
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      validation: {
        simpleSchema: notificationTypeSettings,
        optional: true,
      },
    },
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
      defaultValue: { channel: "both", batchingFrequency: "realtime", timeOfDayGMT: 12, dayOfWeekGMT: "Monday" },
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      validation: {
        simpleSchema: notificationTypeSettings,
        optional: true,
      },
    },
    form: {
      label: "Private messages",
      control: "NotificationTypeSettingsWidget",
      group: () => formGroups.notifications,
    },
  },
  notificationSharedWithMe: {
    database: {
      type: "JSONB",
      defaultValue: { channel: "both", batchingFrequency: "realtime", timeOfDayGMT: 12, dayOfWeekGMT: "Monday" },
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      validation: {
        simpleSchema: notificationTypeSettings,
        optional: true,
      },
    },
    form: {
      label: "Draft shared with me",
      control: "NotificationTypeSettingsWidget",
      group: () => formGroups.notifications,
    },
  },
  notificationAlignmentSubmissionApproved: {
    database: {
      type: "JSONB",
      defaultValue: { channel: "both", batchingFrequency: "realtime", timeOfDayGMT: 12, dayOfWeekGMT: "Monday" },
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      validation: {
        simpleSchema: notificationTypeSettings,
        optional: true,
      },
    },
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
      defaultValue: { channel: "both", batchingFrequency: "realtime", timeOfDayGMT: 12, dayOfWeekGMT: "Monday" },
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      validation: {
        simpleSchema: notificationTypeSettings,
        optional: true,
      },
    },
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
      outputType: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      validation: {
        simpleSchema: notificationTypeSettings,
        optional: true,
      },
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
      defaultValue: { channel: "both", batchingFrequency: "realtime", timeOfDayGMT: 12, dayOfWeekGMT: "Monday" },
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      validation: {
        simpleSchema: notificationTypeSettings,
        optional: true,
      },
    },
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
      defaultValue: { channel: "both", batchingFrequency: "realtime", timeOfDayGMT: 12, dayOfWeekGMT: "Monday" },
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      validation: {
        simpleSchema: notificationTypeSettings,
        optional: true,
      },
    },
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
      defaultValue: { channel: "both", batchingFrequency: "realtime", timeOfDayGMT: 12, dayOfWeekGMT: "Monday" },
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      validation: {
        simpleSchema: notificationTypeSettings,
        optional: true,
      },
    },
    form: {
      label: "Comments on unpublished draft posts I've shared",
      control: "NotificationTypeSettingsWidget",
      group: () => formGroups.notifications,
    },
  },
  notificationPostsNominatedReview: {
    database: {
      type: "JSONB",
      defaultValue: { channel: "both", batchingFrequency: "realtime", timeOfDayGMT: 12, dayOfWeekGMT: "Monday" },
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      validation: {
        simpleSchema: notificationTypeSettings,
        optional: true,
      },
    },
    form: {
      hidden: true,
      label: `Nominations of my posts for the ${REVIEW_NAME_IN_SITU}`,
      control: "NotificationTypeSettingsWidget",
      group: () => formGroups.notifications,
    },
  },
  notificationSubforumUnread: {
    database: {
      type: "JSONB",
      defaultValue: { channel: "onsite", batchingFrequency: "daily", timeOfDayGMT: 12, dayOfWeekGMT: "Monday" },
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      validation: {
        simpleSchema: notificationTypeSettings,
        optional: true,
      },
    },
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
      outputType: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      validation: {
        simpleSchema: notificationTypeSettings,
        optional: true,
      },
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
      defaultValue: { channel: "both", batchingFrequency: "realtime", timeOfDayGMT: 12, dayOfWeekGMT: "Monday" },
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      validation: {
        simpleSchema: notificationTypeSettings,
        optional: true,
      },
    },
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
    graphql: {
      outputType: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      validation: {
        simpleSchema: notificationTypeSettings,
        optional: true,
      },
    },
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
      defaultValue: { channel: "both", batchingFrequency: "realtime", timeOfDayGMT: 12, dayOfWeekGMT: "Monday" },
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      validation: {
        simpleSchema: notificationTypeSettings,
        optional: true,
      },
    },
    form: {
      label: "Someone has added me as a coauthor to a post",
      control: "NotificationTypeSettingsWidget",
      group: () => formGroups.notifications,
    },
  },
  notificationDebateCommentsOnSubscribedPost: {
    database: {
      type: "JSONB",
      defaultValue: { channel: "onsite", batchingFrequency: "daily", timeOfDayGMT: 12, dayOfWeekGMT: "Monday" },
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      validation: {
        simpleSchema: notificationTypeSettings,
        optional: true,
      },
    },
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
    graphql: {
      outputType: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      validation: {
        simpleSchema: notificationTypeSettings,
        optional: true,
      },
    },
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
      defaultValue: { channel: "both", batchingFrequency: "realtime", timeOfDayGMT: 12, dayOfWeekGMT: "Monday" },
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      validation: {
        simpleSchema: notificationTypeSettings,
        optional: true,
      },
    },
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
      defaultValue: { channel: "none", batchingFrequency: "realtime", timeOfDayGMT: 12, dayOfWeekGMT: "Monday" },
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      validation: {
        simpleSchema: notificationTypeSettings,
        optional: true,
      },
    },
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
    graphql: {
      outputType: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      validation: {
        simpleSchema: notificationTypeSettings,
        optional: true,
      },
    },
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
      inputType: "Boolean!",
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
      inputType: "Boolean!",
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
      inputType: "Boolean!",
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
      inputType: "Boolean!",
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
  },
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
      label: "Subscribe to the EA Forum Digest emails",
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
  },
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
  },
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
      outputType: "Float",
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
      outputType: "Float",
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
      outputType: "Float",
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
  mongoLocation: {
    database: {
      type: "JSONB",
      denormalized: true,
      canAutoDenormalize: true,
      needsUpdate: hmGinK,
      getValue: hjtvjR,
    },
    graphql: {
      outputType: "JSON",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      onCreate: getDenormalizedFieldOnCreate<"Users">({ getValue: hjtvjR, needsUpdate: hmGinK }),
      onUpdate: getDenormalizedFieldOnUpdate<"Users">({ getValue: hjtvjR, needsUpdate: hmGinK }),
      validation: {
        optional: true,
        blackbox: true,
      },
    },
  },
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
  },
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
      needsUpdate: hCSYZF,
      getValue: h7EQ3h,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      onCreate: getDenormalizedFieldOnCreate<"Users">({ getValue: h7EQ3h, needsUpdate: hCSYZF }),
      onUpdate: getDenormalizedFieldOnUpdate<"Users">({ getValue: h7EQ3h, needsUpdate: hCSYZF }),
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
      needsUpdate: hhMzyC,
      getValue: h2Ewjc,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      onCreate: getDenormalizedFieldOnCreate<"Users">({ getValue: h2Ewjc, needsUpdate: hhMzyC }),
      onUpdate: getDenormalizedFieldOnUpdate<"Users">({ getValue: h2Ewjc, needsUpdate: hhMzyC }),
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
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
  },
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
      needsUpdate: hTcEov,
      getValue: heeJHD,
    },
    graphql: {
      outputType: "JSON",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      onCreate: getDenormalizedFieldOnCreate<"Users">({ getValue: heeJHD, needsUpdate: hTcEov }),
      onUpdate: getDenormalizedFieldOnUpdate<"Users">({ getValue: heeJHD, needsUpdate: hTcEov }),
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
  allVotes: {
    graphql: {
      outputType: "[Vote]",
      canRead: ["admins", "sunshineRegiment"],
      resolver: async (document, args, context) => {
        const { Votes, currentUser } = context;
        const votes = await Votes.find({
          userId: document._id,
          cancelled: false,
        }).fetch();
        if (!votes.length) return [];
        return await accessFilterMultiple(currentUser, "Votes", votes, context);
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
      outputType: "Float",
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
      outputType: "[String]",
      canRead: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
  },
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
      outputType: "[JSON]",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns],
      validation: {
        simpleSchema: [partiallyReadSequenceItem],
        optional: true,
      },
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
  },
  reviewVoteCount: {
    graphql: {
      outputType: "Int!",
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
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
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
      outputType: "Float",
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
      outputType: "Float",
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
      resolver: async (user, args, context) => {
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
      outputType: "Float",
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
      outputType: "Float",
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
      outputType: "Float",
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
        if (!document.abTestKey) {
          return getUserABTestKey({
            clientId: context.clientId ?? randomId(),
          });
        }
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
      type: "JSONB",
    },
    graphql: {
      outputType: "JSON",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      validation: {
        optional: true,
        blackbox: true,
      },
    },
  },
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
      defaultValue: {},
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Date",
      inputType: "Date!",
      canRead: ["guests"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members"],
    },
  },
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
      outputType: "[String]",
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
      outputType: "[String]",
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
  organizerOfGroupIds: {
    database: {
      type: "VARCHAR(27)[]",
      defaultValue: [],
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "[String]",
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
      outputType: "[String]",
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
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      validation: {
        allowedValues: ["card", "list"],
        optional: true,
      },
    },
  },
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
  },
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
  },
  hideFromPeopleDirectory: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
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
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Allow Session Replay",
      tooltip:
        "Allow us to capture a video-like recording of your browser session (using Datadog Session Replay) — this is useful for debugging and improving the site.",
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
      outputType: "Float",
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
      outputType: "Float",
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
      outputType: "Float",
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
      outputType: "Float",
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
        const rateLimit = await rateLimitDateWhenUserNextAbleToPost(user);
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
        return getRecentKarmaInfo(user._id);
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
  },
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
      },
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"Users">>;

export default schema;
