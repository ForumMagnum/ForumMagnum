// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import SimpleSchema from "simpl-schema";
import {
  userGetProfileUrl,
  getUserEmail, SOCIAL_MEDIA_PROFILE_FIELDS,
  getAuth0Provider
} from "./helpers";
import { userGetEditUrl } from "../../vulcan-users/helpers";
import { getAllUserGroups, userOwns, userIsAdmin } from "../../vulcan-users/permissions";
import { formGroups } from "./formGroups";
import * as _ from "underscore";
import {
  isAF,
  isEAForum, isLWorAF
} from "../../instanceSettings";
import {
  accessFilterMultiple, arrayOfForeignKeysOnCreate, generateIdResolverMulti,
  generateIdResolverSingle,
  getDenormalizedCountOfReferencesGetValue,
  getDenormalizedFieldOnCreate,
  getDenormalizedFieldOnUpdate,
  getFillIfMissing,
  googleLocationToMongoLocation, schemaDefaultValue, throwIfSetToNull
} from "../../utils/schemaUtils";
import { postStatuses } from "../posts/constants";
import { REVIEW_YEAR } from "../../reviewUtils";
import uniqBy from "lodash/uniqBy";
import { userThemeSettings } from "../../../themes/themeNames";
import type { ForumIconName } from "../../../components/common/ForumIcon";
import { getCommentViewOptions } from "../../commentViewOptions";
import {
  userCanViewJargonTerms
} from "../../betas";
import { TupleSet, UnionOf } from "../../utils/typeGuardUtils";
import { randomId } from "../../random";
import { getUserABTestKey } from "../../abTestImpl";
import { DeferredForumSelect } from "../../forumTypeUtils";
import { getNestedProperty } from "../../vulcan-lib/utils";
import { addGraphQLSchema } from "../../vulcan-lib/graphql";
import { getDenormalizedEditableResolver, getRevisionsResolver, getVersionResolver, RevisionStorageType } from "@/lib/editor/make_editable";
import { markdownToHtml, dataToMarkdown } from "@/server/editor/conversionUtils";
import { getKarmaChangeDateRange, getKarmaChangeNextBatchDate, getKarmaChanges } from "@/server/karmaChanges";
import { rateLimitDateWhenUserNextAbleToComment, rateLimitDateWhenUserNextAbleToPost, getRecentKarmaInfo } from "@/server/rateLimitUtils";

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

const hEAm3D = (user, document) => {
  return userOwns(user, document) || userIsAdmin(user);
};
const hNE6JJ = (data) => "googleLocation" in data;
const h7uukg = async (user) => {
  if (user.googleLocation) return googleLocationToMongoLocation(user.googleLocation);
  return null;
};
const hzrSET = (data) => "mapLocation" in data;
const h3yBEz = async (user) => {
  return !!user.mapLocation;
};
const hneryH = (data) => "mapMarkerText" in data;
const h3yMbL = async (user) => {
  if (!user.mapMarkerText) return "";
  return await markdownToHtml(user.mapMarkerText);
};
const hjztHb = (data) => "nearbyEventsNotificationsLocation" in data;
const hzJqLL = async (user) => {
  if (user.nearbyEventsNotificationsLocation)
    return googleLocationToMongoLocation(user.nearbyEventsNotificationsLocation);
};

const schema: Record<string, NewCollectionFieldSpecification<"Users">> = {
  _id: {
    database: {
      type: "VARCHAR(27)",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
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
      type: "Float",
      canRead: ["guests"],
      onCreate: getFillIfMissing(1),
      onUpdate: () => 1,
    },
  },
  createdAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      type: "Date",
      canRead: ["guests"],
      onCreate: () => new Date(),
    },
  },
  legacyData: {
    database: {
      type: "JSONB",
      nullable: true,
    },
    graphql: {
      type: "JSON",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  moderationGuidelines: {
    graphql: {
      type: "Revision",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: [userOwns, "sunshineRegiment", "admins"],
      validation: {
        simpleSchema: RevisionStorageType,
      },
      resolver: getDenormalizedEditableResolver("Users", "moderationGuidelines"),
    },
  },
  moderationGuidelines_latest: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
    },
  },
  moderationGuidelinesRevisions: {
    graphql: {
      type: "[Revision]",
      canRead: ["guests"],
      resolver: getRevisionsResolver("moderationGuidelinesRevisions"),
    },
  },
  moderationGuidelinesVersion: {
    graphql: {
      type: "String",
      canRead: ["guests"],
      resolver: getVersionResolver("moderationGuidelinesVersion"),
    },
  },
  howOthersCanHelpMe: {
    graphql: {
      type: "Revision",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: [userOwns, "sunshineRegiment", "admins"],
      validation: {
        simpleSchema: RevisionStorageType,
      },
      resolver: getDenormalizedEditableResolver("Users", "howOthersCanHelpMe"),
    },
  },
  howOthersCanHelpMe_latest: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
    },
  },
  howOthersCanHelpMeRevisions: {
    graphql: {
      type: "[Revision]",
      canRead: ["guests"],
      resolver: getRevisionsResolver("howOthersCanHelpMeRevisions"),
    },
  },
  howOthersCanHelpMeVersion: {
    graphql: {
      type: "String",
      canRead: ["guests"],
      resolver: getVersionResolver("howOthersCanHelpMeVersion"),
    },
  },
  howICanHelpOthers: {
    graphql: {
      type: "Revision",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: [userOwns, "sunshineRegiment", "admins"],
      validation: {
        simpleSchema: RevisionStorageType,
      },
      resolver: getDenormalizedEditableResolver("Users", "howICanHelpOthers"),
    },
  },
  howICanHelpOthers_latest: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
    },
  },
  howICanHelpOthersRevisions: {
    graphql: {
      type: "[Revision]",
      canRead: ["guests"],
      resolver: getRevisionsResolver("howICanHelpOthersRevisions"),
    },
  },
  howICanHelpOthersVersion: {
    graphql: {
      type: "String",
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
      type: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      slugCallbackOptions: {
        collectionsToAvoidCollisionsWith: ["Users"],
        getTitle: (u) => u.displayName ?? createDisplayName(u),
        onCollision: "rejectIfExplicit",
        includesOldSlugs: true,
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
      type: "[String]",
      canRead: ["guests"],
      onCreate: getFillIfMissing([]),
      onUpdate: throwIfSetToNull,
    },
  },
  biography: {
    graphql: {
      type: "Revision",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: [userOwns, "sunshineRegiment", "admins"],
      validation: {
        simpleSchema: RevisionStorageType,
      },
      resolver: getDenormalizedEditableResolver("Users", "biography"),
    },
  },
  biography_latest: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
    },
  },
  biographyRevisions: {
    graphql: {
      type: "[Revision]",
      canRead: ["guests"],
      resolver: getRevisionsResolver("biographyRevisions"),
    },
  },
  biographyVersion: {
    graphql: {
      type: "String",
      canRead: ["guests"],
      resolver: getVersionResolver("biographyVersion"),
    },
  },
  username: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["members"],
      onCreate: ({ document: user }) => {
        if (!user.username && user.services?.twitter?.screenName) {
          return user.services.twitter.screenName;
        }
      },
    },
  },
  emails: {
    database: {
      type: "JSONB[]",
    },
    graphql: {
      type: "[JSON]",
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "realAdmins"],
      canCreate: ["admins"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
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
    graphql: {
      type: "JSON",
      canCreate: ["members"],
    },
  },
  services: {
    database: {
      type: "JSONB",
    },
    graphql: {
      type: "JSON",
      canRead: hEAm3D,
    },
  },
  hasAuth0Id: {
    graphql: {
      type: "Boolean",
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
      type: "String",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins", "members"],
      canCreate: ["sunshineRegiment", "admins"],
      onCreate: ({ document: user }) => {
        return user.displayName || createDisplayName(user);
      },
    },
  },
  previousDisplayName: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
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
      type: "String",
      canRead: (user, document) => {
        return userOwns(user, document) || userIsAdmin(user) || (user?.groups?.includes("sunshineRegiment") ?? false);
      },
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
        regEx: {},
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
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
      type: "[String]",
      canRead: ["guests"],
      canUpdate: ["alignmentForumAdmins", "admins", "realAdmins"],
      canCreate: ["admins"],
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
      type: "String",
      canRead: ["guests"],
      resolver: (user, args, context) => {
        return userGetProfileUrl(user, true);
      },
    },
  },
  pagePath: {
    graphql: {
      type: "String",
      canRead: ["guests"],
      resolver: (user, args, context) => {
        return userGetProfileUrl(user, false);
      },
    },
  },
  editUrl: {
    graphql: {
      type: "String",
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
      type: "Boolean",
      canRead: ["guests"],
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
      type: "JSON",
      canRead: hEAm3D,
      canUpdate: hEAm3D,
      canCreate: ["members"],
      onCreate: getFillIfMissing({ name: "default" }),
      onUpdate: throwIfSetToNull,
      validation: {
        simpleSchema: FILL_THIS_IN,
      },
    },
    form: {
      order: 1,
      control: "ThemeSelect",
      hidden: false,
      group: () => formGroups.siteCustomizations,
    },
  },
  lastUsedTimezone: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns],
      canCreate: ["members"],
    },
  },
  whenConfirmationEmailSent: {
    database: {
      type: "TIMESTAMPTZ",
    },
    graphql: {
      type: "Date",
      canRead: ["members"],
      canUpdate: [],
      canCreate: ["members"],
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
      type: "Boolean",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
  },
  commentSorting: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
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
      type: "String",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
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
      type: "String",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      onCreate: getFillIfMissing("listView"),
      onUpdate: throwIfSetToNull,
      validation: {
        allowedValues: ["listView", "gridView"],
      },
    },
  },
  noKibitz: {
    database: {
      type: "BOOL",
    },
    graphql: {
      type: "Boolean",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
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
      type: "Boolean",
      canRead: [userOwns, "admins"],
      canUpdate: ["function:(user, document)=>{ return (0, _permissions.userOw...", "sunshineRegiment", "admins"],
      canCreate: ["members", "sunshineRegiment", "admins"],
    },
    form: {
      order: 69,
      label: "Enable option on posts to hide karma visibility",
      control: "checkbox",
      hidden: false,
      group: () => formGroups.siteCustomizations,
    },
  },
  showPostAuthorCard: {
    database: {
      type: "BOOL",
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
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
      type: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
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
      type: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
    form: {
      order: 93,
      label: "Hide community section from the frontpage",
      control: "checkbox",
      hidden: false,
      group: () => formGroups.siteCustomizations,
    },
  },
  expandedFrontpageSections: {
    database: {
      type: "JSONB",
      nullable: true,
    },
    graphql: {
      type: "JSON",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        simpleSchema: FILL_THIS_IN,
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
    form: {
      order: 94,
      label: "Show Community posts in Recent Discussion",
      control: "checkbox",
      hidden: false,
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
    form: {
      order: 95,
      label: "Hide recommendations from the posts page",
      control: "checkbox",
      hidden: false,
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
  },
  optedOutOfSurveys: {
    database: {
      type: "BOOL",
      nullable: true,
    },
    graphql: {
      type: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
    },
    form: {
      order: 97,
      label: "Opt out of user surveys",
      hidden: false,
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
      type: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
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
      type: "Boolean",
      canRead: ["members"],
      canUpdate: [userOwns],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
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
      type: "Boolean",
      canRead: ["members"],
      canUpdate: [userOwns],
      onCreate: getFillIfMissing(true),
      onUpdate: throwIfSetToNull,
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
      type: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
  },
  hideNavigationSidebar: {
    database: {
      type: "BOOL",
    },
    graphql: {
      type: "Boolean",
      canRead: function (user, document) {
        if (!user) {
          // not logged in
          return false;
        }
        if (!document) {
          // no document specified
          return false;
        }
        if (document.userId) {
          // case 1: document is a post or a comment, use userId to check
          return user._id === document.userId;
        } else {
          // case 2: document is a user, use _id or slug to check
          const documentUser = document;
          const idsExistAndMatch = !!user._id && !!documentUser._id && user._id === documentUser._id;
          const slugsExistAndMatch = !!user.slug && !!documentUser.slug && user.slug === documentUser.slug;
          return idsExistAndMatch || slugsExistAndMatch;
        }
      },
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: "guests",
    },
  },
  currentFrontpageFilter: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: function (user, document) {
        if (!user) {
          // not logged in
          return false;
        }
        if (!document) {
          // no document specified
          return false;
        }
        if (document.userId) {
          // case 1: document is a post or a comment, use userId to check
          return user._id === document.userId;
        } else {
          // case 2: document is a user, use _id or slug to check
          const documentUser = document;
          const idsExistAndMatch = !!user._id && !!documentUser._id && user._id === documentUser._id;
          const slugsExistAndMatch = !!user.slug && !!documentUser.slug && user.slug === documentUser.slug;
          return idsExistAndMatch || slugsExistAndMatch;
        }
      },
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: "guests",
    },
  },
  frontpageSelectedTab: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      type: "String",
      canRead: function (user, document) {
        if (!user) {
          // not logged in
          return false;
        }
        if (!document) {
          // no document specified
          return false;
        }
        if (document.userId) {
          // case 1: document is a post or a comment, use userId to check
          return user._id === document.userId;
        } else {
          // case 2: document is a user, use _id or slug to check
          const documentUser = document;
          const idsExistAndMatch = !!user._id && !!documentUser._id && user._id === documentUser._id;
          const slugsExistAndMatch = !!user.slug && !!documentUser.slug && user.slug === documentUser.slug;
          return idsExistAndMatch || slugsExistAndMatch;
        }
      },
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: "guests",
    },
  },
  frontpageFilterSettings: {
    database: {
      type: "JSONB",
    },
    graphql: {
      type: "JSON",
      canRead: function (user, document) {
        if (!user) {
          // not logged in
          return false;
        }
        if (!document) {
          // no document specified
          return false;
        }
        if (document.userId) {
          // case 1: document is a post or a comment, use userId to check
          return user._id === document.userId;
        } else {
          // case 2: document is a user, use _id or slug to check
          const documentUser = document;
          const idsExistAndMatch = !!user._id && !!documentUser._id && user._id === documentUser._id;
          const slugsExistAndMatch = !!user.slug && !!documentUser.slug && user.slug === documentUser.slug;
          return idsExistAndMatch || slugsExistAndMatch;
        }
      },
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: "guests",
    },
  },
  hideFrontpageFilterSettingsDesktop: {
    database: {
      type: "BOOL",
      nullable: true,
    },
    graphql: {
      type: "Boolean",
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: "guests",
    },
  },
  allPostsTimeframe: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: function (user, document) {
        if (!user) {
          // not logged in
          return false;
        }
        if (!document) {
          // no document specified
          return false;
        }
        if (document.userId) {
          // case 1: document is a post or a comment, use userId to check
          return user._id === document.userId;
        } else {
          // case 2: document is a user, use _id or slug to check
          const documentUser = document;
          const idsExistAndMatch = !!user._id && !!documentUser._id && user._id === documentUser._id;
          const slugsExistAndMatch = !!user.slug && !!documentUser.slug && user.slug === documentUser.slug;
          return idsExistAndMatch || slugsExistAndMatch;
        }
      },
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: "guests",
    },
  },
  allPostsFilter: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: function (user, document) {
        if (!user) {
          // not logged in
          return false;
        }
        if (!document) {
          // no document specified
          return false;
        }
        if (document.userId) {
          // case 1: document is a post or a comment, use userId to check
          return user._id === document.userId;
        } else {
          // case 2: document is a user, use _id or slug to check
          const documentUser = document;
          const idsExistAndMatch = !!user._id && !!documentUser._id && user._id === documentUser._id;
          const slugsExistAndMatch = !!user.slug && !!documentUser.slug && user.slug === documentUser.slug;
          return idsExistAndMatch || slugsExistAndMatch;
        }
      },
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: "guests",
    },
  },
  allPostsSorting: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: function (user, document) {
        if (!user) {
          // not logged in
          return false;
        }
        if (!document) {
          // no document specified
          return false;
        }
        if (document.userId) {
          // case 1: document is a post or a comment, use userId to check
          return user._id === document.userId;
        } else {
          // case 2: document is a user, use _id or slug to check
          const documentUser = document;
          const idsExistAndMatch = !!user._id && !!documentUser._id && user._id === documentUser._id;
          const slugsExistAndMatch = !!user.slug && !!documentUser.slug && user.slug === documentUser.slug;
          return idsExistAndMatch || slugsExistAndMatch;
        }
      },
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: "guests",
    },
  },
  allPostsShowLowKarma: {
    database: {
      type: "BOOL",
    },
    graphql: {
      type: "Boolean",
      canRead: function (user, document) {
        if (!user) {
          // not logged in
          return false;
        }
        if (!document) {
          // no document specified
          return false;
        }
        if (document.userId) {
          // case 1: document is a post or a comment, use userId to check
          return user._id === document.userId;
        } else {
          // case 2: document is a user, use _id or slug to check
          const documentUser = document;
          const idsExistAndMatch = !!user._id && !!documentUser._id && user._id === documentUser._id;
          const slugsExistAndMatch = !!user.slug && !!documentUser.slug && user.slug === documentUser.slug;
          return idsExistAndMatch || slugsExistAndMatch;
        }
      },
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: "guests",
    },
  },
  allPostsIncludeEvents: {
    database: {
      type: "BOOL",
    },
    graphql: {
      type: "Boolean",
      canRead: function (user, document) {
        if (!user) {
          // not logged in
          return false;
        }
        if (!document) {
          // no document specified
          return false;
        }
        if (document.userId) {
          // case 1: document is a post or a comment, use userId to check
          return user._id === document.userId;
        } else {
          // case 2: document is a user, use _id or slug to check
          const documentUser = document;
          const idsExistAndMatch = !!user._id && !!documentUser._id && user._id === documentUser._id;
          const slugsExistAndMatch = !!user.slug && !!documentUser.slug && user.slug === documentUser.slug;
          return idsExistAndMatch || slugsExistAndMatch;
        }
      },
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: "guests",
    },
  },
  allPostsHideCommunity: {
    database: {
      type: "BOOL",
    },
    graphql: {
      type: "Boolean",
      canRead: function (user, document) {
        if (!user) {
          // not logged in
          return false;
        }
        if (!document) {
          // no document specified
          return false;
        }
        if (document.userId) {
          // case 1: document is a post or a comment, use userId to check
          return user._id === document.userId;
        } else {
          // case 2: document is a user, use _id or slug to check
          const documentUser = document;
          const idsExistAndMatch = !!user._id && !!documentUser._id && user._id === documentUser._id;
          const slugsExistAndMatch = !!user.slug && !!documentUser.slug && user.slug === documentUser.slug;
          return idsExistAndMatch || slugsExistAndMatch;
        }
      },
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: "guests",
    },
  },
  allPostsOpenSettings: {
    database: {
      type: "BOOL",
    },
    graphql: {
      type: "Boolean",
      canRead: function (user, document) {
        if (!user) {
          // not logged in
          return false;
        }
        if (!document) {
          // no document specified
          return false;
        }
        if (document.userId) {
          // case 1: document is a post or a comment, use userId to check
          return user._id === document.userId;
        } else {
          // case 2: document is a user, use _id or slug to check
          const documentUser = document;
          const idsExistAndMatch = !!user._id && !!documentUser._id && user._id === documentUser._id;
          const slugsExistAndMatch = !!user.slug && !!documentUser.slug && user.slug === documentUser.slug;
          return idsExistAndMatch || slugsExistAndMatch;
        }
      },
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: "guests",
    },
  },
  draftsListSorting: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: function (user, document) {
        if (!user) {
          // not logged in
          return false;
        }
        if (!document) {
          // no document specified
          return false;
        }
        if (document.userId) {
          // case 1: document is a post or a comment, use userId to check
          return user._id === document.userId;
        } else {
          // case 2: document is a user, use _id or slug to check
          const documentUser = document;
          const idsExistAndMatch = !!user._id && !!documentUser._id && user._id === documentUser._id;
          const slugsExistAndMatch = !!user.slug && !!documentUser.slug && user.slug === documentUser.slug;
          return idsExistAndMatch || slugsExistAndMatch;
        }
      },
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: "guests",
    },
  },
  draftsListShowArchived: {
    database: {
      type: "BOOL",
    },
    graphql: {
      type: "Boolean",
      canRead: function (user, document) {
        if (!user) {
          // not logged in
          return false;
        }
        if (!document) {
          // no document specified
          return false;
        }
        if (document.userId) {
          // case 1: document is a post or a comment, use userId to check
          return user._id === document.userId;
        } else {
          // case 2: document is a user, use _id or slug to check
          const documentUser = document;
          const idsExistAndMatch = !!user._id && !!documentUser._id && user._id === documentUser._id;
          const slugsExistAndMatch = !!user.slug && !!documentUser.slug && user.slug === documentUser.slug;
          return idsExistAndMatch || slugsExistAndMatch;
        }
      },
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: "guests",
    },
  },
  draftsListShowShared: {
    database: {
      type: "BOOL",
    },
    graphql: {
      type: "Boolean",
      canRead: function (user, document) {
        if (!user) {
          // not logged in
          return false;
        }
        if (!document) {
          // no document specified
          return false;
        }
        if (document.userId) {
          // case 1: document is a post or a comment, use userId to check
          return user._id === document.userId;
        } else {
          // case 2: document is a user, use _id or slug to check
          const documentUser = document;
          const idsExistAndMatch = !!user._id && !!documentUser._id && user._id === documentUser._id;
          const slugsExistAndMatch = !!user.slug && !!documentUser.slug && user.slug === documentUser.slug;
          return idsExistAndMatch || slugsExistAndMatch;
        }
      },
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: "guests",
    },
  },
  lastNotificationsCheck: {
    database: {
      type: "TIMESTAMPTZ",
      logChanges: false,
    },
    graphql: {
      type: "Date",
      canRead: [userOwns, "admins"],
      canUpdate: function (user, document) {
        if (!user) {
          // not logged in
          return false;
        }
        if (!document) {
          // no document specified
          return false;
        }
        if (document.userId) {
          // case 1: document is a post or a comment, use userId to check
          return user._id === document.userId;
        } else {
          // case 2: document is a user, use _id or slug to check
          const documentUser = document;
          const idsExistAndMatch = !!user._id && !!documentUser._id && user._id === documentUser._id;
          const slugsExistAndMatch = !!user.slug && !!documentUser.slug && user.slug === documentUser.slug;
          return idsExistAndMatch || slugsExistAndMatch;
        }
      },
      canCreate: "guests",
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
      type: "Float",
      canRead: ["guests"],
      onCreate: getFillIfMissing(0),
      onUpdate: throwIfSetToNull,
    },
  },
  goodHeartTokens: {
    database: {
      type: "DOUBLE PRECISION",
    },
    graphql: {
      type: "Float",
      canRead: ["guests"],
    },
  },
  moderationStyle: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["members", "sunshineRegiment", "admins"],
      canCreate: ["members", "sunshineRegiment", "admins"],
    },
  },
  moderatorAssistance: {
    database: {
      type: "BOOL",
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members", "sunshineRegiment", "admins"],
    },
  },
  collapseModerationGuidelines: {
    database: {
      type: "BOOL",
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members", "sunshineRegiment", "admins"],
    },
  },
  bannedUserIds: {
    database: {
      type: "VARCHAR(27)[]",
    },
    graphql: {
      type: "[String]",
      canRead: ["guests"],
      canUpdate: ["function:(user, document)=>{ return (0, _permissions.userOw...", "sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
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
      type: "[String]",
      canRead: ["guests"],
      canUpdate: ["function:(user, document)=>{ return (0, _permissions.userOw...", "sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
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
      type: "[JSON]",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      onCreate: arrayOfForeignKeysOnCreate,
      onUpdate: ({ data, currentUser, oldDocument }) => {
        if (data?.bookmarkedPostsMetadata) {
          return _.uniq(data?.bookmarkedPostsMetadata, "postId");
        }
      },
    },
  },
  bookmarkedPosts: {
    graphql: {
      type: "[Post!]!",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      resolver: generateIdResolverMulti({
        collectionName: "Users",
        fieldName: "bookmarkedPostsMetadata",
        getKey: FILL_THIS_IN,
      }),
    },
    form: {
      hidden: true,
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
      type: "[JSON]",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      onCreate: arrayOfForeignKeysOnCreate,
      onUpdate: ({ data, currentUser, oldDocument }) => {
        if (data?.hiddenPostsMetadata) {
          return uniqBy(data?.hiddenPostsMetadata, "postId");
        }
      },
    },
  },
  hiddenPosts: {
    graphql: {
      type: "[Post!]!",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      resolver: generateIdResolverMulti({
        collectionName: "Users",
        fieldName: "hiddenPostsMetadata",
        getKey: FILL_THIS_IN,
      }),
    },
    form: {
      hidden: true,
    },
  },
  legacyId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["members"],
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["members", "admins"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
  },
  permanentDeletionRequestedAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      type: "Date",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: ["members", "admins"],
      onUpdate: ({ data }) => {
        if (!data.permanentDeletionRequestedAt) return data.permanentDeletionRequestedAt;
        // Whenever the field is set, reset it to the current server time to ensure users
        // can't work around the cooling off period
        return new Date();
      },
    },
  },
  voteBanned: {
    database: {
      type: "BOOL",
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["admins"],
    },
  },
  nullifyVotes: {
    database: {
      type: "BOOL",
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["admins"],
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["admins"],
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
      type: "Date",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["admins"],
    },
    form: {
      label: "Ban user until",
      control: "datetime",
      group: () => formGroups.banUser,
    },
  },
  IPs: {
    graphql: {
      type: "[String!]",
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(true),
      onUpdate: throwIfSetToNull,
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(true),
      onUpdate: throwIfSetToNull,
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(true),
      onUpdate: throwIfSetToNull,
    },
    form: {
      label: "Auto-subscribe to posts/events in groups I organize",
      control: "checkbox",
      hidden: false,
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
      type: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      onCreate: getFillIfMissing(defaultNotificationTypeSettings),
      onUpdate: throwIfSetToNull,
      validation: {
        simpleSchema: notificationTypeSettings,
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
      type: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      onCreate: getFillIfMissing(defaultNotificationTypeSettings),
      onUpdate: throwIfSetToNull,
      validation: {
        simpleSchema: notificationTypeSettings,
      },
    },
    form: {
      label: "Quick takes by users I'm subscribed to",
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
      type: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      onCreate: getFillIfMissing(defaultNotificationTypeSettings),
      onUpdate: throwIfSetToNull,
      validation: {
        simpleSchema: notificationTypeSettings,
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
      type: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      onCreate: getFillIfMissing(defaultNotificationTypeSettings),
      onUpdate: throwIfSetToNull,
      validation: {
        simpleSchema: notificationTypeSettings,
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
      type: "JSON",
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
      onUpdate: throwIfSetToNull,
      validation: {
        simpleSchema: notificationTypeSettings,
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
      type: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      onCreate: getFillIfMissing(defaultNotificationTypeSettings),
      onUpdate: throwIfSetToNull,
      validation: {
        simpleSchema: notificationTypeSettings,
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
      type: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      onCreate: getFillIfMissing({
        channel: "both",
        batchingFrequency: "realtime",
        timeOfDayGMT: 12,
        dayOfWeekGMT: "Monday",
      }),
      onUpdate: throwIfSetToNull,
      validation: {
        simpleSchema: notificationTypeSettings,
      },
    },
    form: {
      label: "Posts/events in groups I'm subscribed to",
      control: "NotificationTypeSettingsWidget",
      hidden: false,
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
      type: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      onCreate: getFillIfMissing(defaultNotificationTypeSettings),
      onUpdate: throwIfSetToNull,
      validation: {
        simpleSchema: notificationTypeSettings,
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
      type: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      onCreate: getFillIfMissing({
        channel: "both",
        batchingFrequency: "realtime",
        timeOfDayGMT: 12,
        dayOfWeekGMT: "Monday",
      }),
      onUpdate: throwIfSetToNull,
      validation: {
        simpleSchema: notificationTypeSettings,
      },
    },
    form: {
      label: "Posts added to sequences I'm subscribed to",
      control: "NotificationTypeSettingsWidget",
      hidden: false,
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
      type: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      onCreate: getFillIfMissing({
        channel: "both",
        batchingFrequency: "realtime",
        timeOfDayGMT: 12,
        dayOfWeekGMT: "Monday",
      }),
      onUpdate: throwIfSetToNull,
      validation: {
        simpleSchema: notificationTypeSettings,
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
      type: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      onCreate: getFillIfMissing({
        channel: "both",
        batchingFrequency: "realtime",
        timeOfDayGMT: 12,
        dayOfWeekGMT: "Monday",
      }),
      onUpdate: throwIfSetToNull,
      validation: {
        simpleSchema: notificationTypeSettings,
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
      type: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      onCreate: getFillIfMissing({
        channel: "both",
        batchingFrequency: "realtime",
        timeOfDayGMT: 12,
        dayOfWeekGMT: "Monday",
      }),
      onUpdate: throwIfSetToNull,
      validation: {
        simpleSchema: notificationTypeSettings,
      },
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
      type: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      onCreate: getFillIfMissing({
        channel: "both",
        batchingFrequency: "realtime",
        timeOfDayGMT: 12,
        dayOfWeekGMT: "Monday",
      }),
      onUpdate: throwIfSetToNull,
      validation: {
        simpleSchema: notificationTypeSettings,
      },
    },
    form: {
      label: "New events in my notification radius",
      control: "NotificationTypeSettingsWidget",
      hidden: false,
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
      type: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      onCreate: getFillIfMissing(defaultNotificationTypeSettings),
      onUpdate: throwIfSetToNull,
      validation: {
        simpleSchema: notificationTypeSettings,
      },
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
      type: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      onCreate: getFillIfMissing({
        channel: "both",
        batchingFrequency: "realtime",
        timeOfDayGMT: 12,
        dayOfWeekGMT: "Monday",
      }),
      onUpdate: throwIfSetToNull,
      validation: {
        simpleSchema: notificationTypeSettings,
      },
    },
    form: {
      label: "New RSVP responses to my events",
      control: "NotificationTypeSettingsWidget",
      hidden: false,
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
      type: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      onCreate: getFillIfMissing({
        channel: "both",
        batchingFrequency: "realtime",
        timeOfDayGMT: 12,
        dayOfWeekGMT: "Monday",
      }),
      onUpdate: throwIfSetToNull,
      validation: {
        simpleSchema: notificationTypeSettings,
      },
    },
    form: {
      label: "Group administration notifications",
      control: "NotificationTypeSettingsWidget",
      hidden: false,
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
      type: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      onCreate: getFillIfMissing({
        channel: "both",
        batchingFrequency: "realtime",
        timeOfDayGMT: 12,
        dayOfWeekGMT: "Monday",
      }),
      onUpdate: throwIfSetToNull,
      validation: {
        simpleSchema: notificationTypeSettings,
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
      type: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      onCreate: getFillIfMissing({
        channel: "both",
        batchingFrequency: "realtime",
        timeOfDayGMT: 12,
        dayOfWeekGMT: "Monday",
      }),
      onUpdate: throwIfSetToNull,
      validation: {
        simpleSchema: notificationTypeSettings,
      },
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
      type: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      onCreate: getFillIfMissing({
        channel: "onsite",
        batchingFrequency: "daily",
        timeOfDayGMT: 12,
        dayOfWeekGMT: "Monday",
      }),
      onUpdate: throwIfSetToNull,
      validation: {
        simpleSchema: notificationTypeSettings,
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
      type: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      onCreate: getFillIfMissing(defaultNotificationTypeSettings),
      onUpdate: throwIfSetToNull,
      validation: {
        simpleSchema: notificationTypeSettings,
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
      type: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      onCreate: getFillIfMissing({
        channel: "both",
        batchingFrequency: "realtime",
        timeOfDayGMT: 12,
        dayOfWeekGMT: "Monday",
      }),
      onUpdate: throwIfSetToNull,
      validation: {
        simpleSchema: notificationTypeSettings,
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
      type: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      onCreate: getFillIfMissing(defaultNotificationTypeSettings),
      onUpdate: throwIfSetToNull,
      validation: {
        simpleSchema: notificationTypeSettings,
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
      type: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      onCreate: getFillIfMissing({
        channel: "both",
        batchingFrequency: "realtime",
        timeOfDayGMT: 12,
        dayOfWeekGMT: "Monday",
      }),
      onUpdate: throwIfSetToNull,
      validation: {
        simpleSchema: notificationTypeSettings,
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
      type: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      onCreate: getFillIfMissing({
        channel: "onsite",
        batchingFrequency: "daily",
        timeOfDayGMT: 12,
        dayOfWeekGMT: "Monday",
      }),
      onUpdate: throwIfSetToNull,
      validation: {
        simpleSchema: notificationTypeSettings,
      },
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
      type: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      onCreate: getFillIfMissing(defaultNotificationTypeSettings),
      onUpdate: throwIfSetToNull,
      validation: {
        simpleSchema: notificationTypeSettings,
      },
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
      type: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      onCreate: getFillIfMissing({
        channel: "both",
        batchingFrequency: "realtime",
        timeOfDayGMT: 12,
        dayOfWeekGMT: "Monday",
      }),
      onUpdate: throwIfSetToNull,
      validation: {
        simpleSchema: notificationTypeSettings,
      },
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
      type: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      onCreate: getFillIfMissing({
        channel: "none",
        batchingFrequency: "realtime",
        timeOfDayGMT: 12,
        dayOfWeekGMT: "Monday",
      }),
      onUpdate: throwIfSetToNull,
      validation: {
        simpleSchema: notificationTypeSettings,
      },
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
      type: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      onCreate: getFillIfMissing(defaultNotificationTypeSettings),
      onUpdate: throwIfSetToNull,
      validation: {
        simpleSchema: notificationTypeSettings,
      },
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
      type: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
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
      type: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
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
      type: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
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
      type: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(true),
      onUpdate: throwIfSetToNull,
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
      type: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(true),
      onUpdate: throwIfSetToNull,
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
      type: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(true),
      onUpdate: throwIfSetToNull,
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
      type: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(true),
      onUpdate: throwIfSetToNull,
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
      type: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
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
      type: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["guests"],
      onCreate: getFillIfMissing({
        updateFrequency: "daily",
        timeOfDayGMT: 11,
        dayOfWeekGMT: "Saturday",
        showNegativeKarma: false,
      }),
      onUpdate: throwIfSetToNull,
      validation: {
        simpleSchema: FILL_THIS_IN,
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
      type: "Date",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["guests"],
    },
  },
  karmaChangeBatchStart: {
    database: {
      type: "TIMESTAMPTZ",
      logChanges: false,
    },
    graphql: {
      type: "Date",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["guests"],
    },
  },
  emailSubscribedToCurated: {
    database: {
      type: "BOOL",
    },
    graphql: {
      type: "Boolean",
      canRead: ["members"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
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
      type: "Boolean",
      canRead: ["members"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
    form: {
      label: "Subscribe to the EA Forum Digest emails",
      hidden: false,
      group: () => formGroups.emails,
    },
  },
  unsubscribeFromAll: {
    database: {
      type: "BOOL",
    },
    graphql: {
      type: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
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
      type: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
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
      type: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
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
      type: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
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
      type: "Float",
      canRead: ["guests"],
      onCreate: () => 0,
      countOfReferences: {
        foreignCollectionName: "Posts",
        foreignFieldName: "userId",
        filterFn: (post) => !!post.frontpageDate,
        resyncElastic: false,
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
      type: "Float",
      canRead: ["guests"],
      onCreate: () => 0,
      countOfReferences: {
        foreignCollectionName: "Sequences",
        foreignFieldName: "userId",
        filterFn: (sequence) => !sequence.draft && !sequence.isDeleted && !sequence.hideFromAuthorPage,
        resyncElastic: false,
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
      type: "Float",
      canRead: ["guests"],
      onCreate: () => 0,
      countOfReferences: {
        foreignCollectionName: "Sequences",
        foreignFieldName: "userId",
        filterFn: (sequence) => sequence.draft && !sequence.isDeleted,
        resyncElastic: false,
      },
    },
  },
  mongoLocation: {
    database: {
      type: "JSONB",
      denormalized: true,
      canAutoDenormalize: true,
      needsUpdate: hNE6JJ,
      getValue: h7uukg,
    },
    graphql: {
      type: "JSON",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      onCreate: getDenormalizedFieldOnCreate<"Users">({ getValue: h7uukg, needsUpdate: hNE6JJ }),
      onUpdate: getDenormalizedFieldOnUpdate<"Users">({ getValue: h7uukg, needsUpdate: hNE6JJ }),
    },
  },
  googleLocation: {
    database: {
      type: "JSONB",
    },
    graphql: {
      type: "JSON",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
    },
    form: {
      form: { stringVersionFieldName: "location" },
      order: 100,
      label: "Account location (used for location-based recommendations)",
      control: "LocationFormComponent",
      hidden: false,
      group: () => formGroups.siteCustomizations,
    },
  },
  location: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
    },
  },
  mapLocation: {
    database: {
      type: "JSONB",
    },
    graphql: {
      type: "JSON",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
    },
  },
  mapLocationLatLng: {
    graphql: {
      type: "LatLng",
      canRead: ["guests"],
      validation: {
        simpleSchema: FILL_THIS_IN,
      },
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
      needsUpdate: hzrSET,
      getValue: h3yBEz,
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      onCreate: getDenormalizedFieldOnCreate<"Users">({ getValue: h3yBEz, needsUpdate: hzrSET }),
      onUpdate: getDenormalizedFieldOnUpdate<"Users">({ getValue: h3yBEz, needsUpdate: hzrSET }),
    },
  },
  mapMarkerText: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
    },
  },
  htmlMapMarkerText: {
    database: {
      type: "TEXT",
      denormalized: true,
      canAutoDenormalize: true,
      needsUpdate: hneryH,
      getValue: h3yMbL,
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      onCreate: getDenormalizedFieldOnCreate<"Users">({ getValue: h3yMbL, needsUpdate: hneryH }),
      onUpdate: getDenormalizedFieldOnUpdate<"Users">({ getValue: h3yMbL, needsUpdate: hneryH }),
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
  },
  nearbyEventsNotificationsLocation: {
    database: {
      type: "JSONB",
    },
    graphql: {
      type: "JSON",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
    },
  },
  nearbyEventsNotificationsMongoLocation: {
    database: {
      type: "JSONB",
      denormalized: true,
      canAutoDenormalize: true,
      needsUpdate: hjztHb,
      getValue: hzJqLL,
    },
    graphql: {
      type: "JSON",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      onCreate: getDenormalizedFieldOnCreate<"Users">({ getValue: hzJqLL, needsUpdate: hjztHb }),
      onUpdate: getDenormalizedFieldOnUpdate<"Users">({ getValue: hzJqLL, needsUpdate: hjztHb }),
    },
  },
  nearbyEventsNotificationsRadius: {
    database: {
      type: "DOUBLE PRECISION",
    },
    graphql: {
      type: "Float",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
    },
  },
  nearbyPeopleNotificationThreshold: {
    database: {
      type: "DOUBLE PRECISION",
    },
    graphql: {
      type: "Float",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
    },
  },
  hideFrontpageMap: {
    database: {
      type: "BOOL",
    },
    graphql: {
      type: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
    },
  },
  hideTaggingProgressBar: {
    database: {
      type: "BOOL",
    },
    graphql: {
      type: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
    },
  },
  hideFrontpageBookAd: {
    database: {
      type: "BOOL",
    },
    graphql: {
      type: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
    },
  },
  hideFrontpageBook2019Ad: {
    database: {
      type: "BOOL",
    },
    graphql: {
      type: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
    },
  },
  hideFrontpageBook2020Ad: {
    database: {
      type: "BOOL",
    },
    graphql: {
      type: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
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
      type: "String",
      canRead: ["admins", "sunshineRegiment"],
      canUpdate: ["admins", "sunshineRegiment"],
      onCreate: getFillIfMissing(""),
      onUpdate: throwIfSetToNull,
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
      type: "Boolean",
      canRead: ["admins", "sunshineRegiment"],
      canUpdate: ["admins", "sunshineRegiment"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
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
      type: "Boolean",
      canRead: ["admins", "sunshineRegiment"],
      canUpdate: ["admins", "sunshineRegiment"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
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
      type: "Boolean",
      canRead: ["admins", "sunshineRegiment"],
      canUpdate: ["admins", "sunshineRegiment"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
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
      type: "Float",
      canRead: ["admins", "sunshineRegiment"],
      canUpdate: ["admins", "sunshineRegiment"],
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
      type: "String",
      canRead: ["sunshineRegiment", "admins", "guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
    },
    form: {
      group: () => formGroups.adminOptions,
    },
  },
  reviewedByUser: {
    graphql: {
      type: "User",
      canRead: ["sunshineRegiment", "admins", "guests"],
      resolver: generateIdResolverSingle({ collectionName: "Users", fieldName: "reviewedByUserId", nullable: false }),
    },
    form: {
      hidden: true,
    },
  },
  isReviewed: {
    graphql: {
      type: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      resolver: (user, args, context) => !!user.reviewedByUserId,
    },
  },
  reviewedAt: {
    database: {
      type: "TIMESTAMPTZ",
    },
    graphql: {
      type: "Date",
      canRead: ["admins", "sunshineRegiment"],
      canUpdate: ["admins", "sunshineRegiment"],
    },
    form: {
      group: () => formGroups.adminOptions,
    },
  },
  spamRiskScore: {
    graphql: {
      type: "Float!",
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
      type: "[Vote]",
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
      type: "Float",
      canRead: ["guests"],
      onCreate: getFillIfMissing(0),
      onUpdate: throwIfSetToNull,
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
      type: "Float",
      canRead: ["admins", "sunshineRegiment"],
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
      type: "Float",
      canRead: ["admins", "sunshineRegiment"],
    },
  },
  smallDownvoteCount: {
    database: {
      type: "DOUBLE PRECISION",
      denormalized: true,
    },
    graphql: {
      type: "Float",
      canRead: ["admins", "sunshineRegiment"],
    },
  },
  bigUpvoteCount: {
    database: {
      type: "DOUBLE PRECISION",
      denormalized: true,
    },
    graphql: {
      type: "Float",
      canRead: ["admins", "sunshineRegiment"],
    },
  },
  bigDownvoteCount: {
    database: {
      type: "DOUBLE PRECISION",
      denormalized: true,
    },
    graphql: {
      type: "Float",
      canRead: ["admins", "sunshineRegiment"],
    },
  },
  voteReceivedCount: {
    database: {
      type: "DOUBLE PRECISION",
      denormalized: true,
    },
    graphql: {
      type: "Float",
      canRead: [userOwns, "admins", "sunshineRegiment"],
    },
  },
  smallUpvoteReceivedCount: {
    database: {
      type: "DOUBLE PRECISION",
      denormalized: true,
    },
    graphql: {
      type: "Float",
      canRead: [userOwns, "admins", "sunshineRegiment"],
    },
  },
  smallDownvoteReceivedCount: {
    database: {
      type: "DOUBLE PRECISION",
      denormalized: true,
    },
    graphql: {
      type: "Float",
      canRead: [userOwns, "admins", "sunshineRegiment"],
    },
  },
  bigUpvoteReceivedCount: {
    database: {
      type: "DOUBLE PRECISION",
      denormalized: true,
    },
    graphql: {
      type: "Float",
      canRead: [userOwns, "admins", "sunshineRegiment"],
    },
  },
  bigDownvoteReceivedCount: {
    database: {
      type: "DOUBLE PRECISION",
      denormalized: true,
    },
    graphql: {
      type: "Float",
      canRead: [userOwns, "admins", "sunshineRegiment"],
    },
  },
  usersContactedBeforeReview: {
    database: {
      type: "TEXT[]",
    },
    graphql: {
      type: "[String]",
      canRead: ["admins", "sunshineRegiment"],
    },
  },
  fullName: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment"],
    },
  },
  shortformFeedId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Posts",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
    },
    form: {
      label: "Quick takes feed ID",
      group: () => formGroups.adminOptions,
    },
  },
  shortformFeed: {
    graphql: {
      type: "Post",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ collectionName: "Users", fieldName: "shortformFeedId", nullable: false }),
    },
    form: {
      hidden: true,
    },
  },
  viewUnreviewedComments: {
    database: {
      type: "BOOL",
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
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
      type: "[JSON]",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns],
      validation: {
        simpleSchema: FILL_THIS_IN,
      },
    },
  },
  beta: {
    database: {
      type: "BOOL",
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
    },
  },
  reviewVotesQuadratic2019: {
    database: {
      type: "BOOL",
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
    },
  },
  reviewVoteCount: {
    graphql: {
      type: "Int!",
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
    },
  },
  petrovPressedButtonDate: {
    database: {
      type: "TIMESTAMPTZ",
    },
    graphql: {
      type: "Date",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
    },
  },
  petrovLaunchCodeDate: {
    database: {
      type: "TIMESTAMPTZ",
    },
    graphql: {
      type: "Date",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
    },
  },
  defaultToCKEditor: {
    database: {
      type: "BOOL",
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins"],
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
      type: "Float",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
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
      type: "Float",
      canRead: ["guests"],
      onCreate: () => 0,
      countOfReferences: {
        foreignCollectionName: "Posts",
        foreignFieldName: "userId",
        filterFn: (post) => !post.draft && !post.rejected && post.status === postStatuses.STATUS_APPROVED,
        resyncElastic: false,
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
      type: "Float",
      canRead: ["guests"],
      onCreate: getFillIfMissing(0),
      onUpdate: throwIfSetToNull,
      countOfReferences: {
        foreignCollectionName: "Posts",
        foreignFieldName: "userId",
        filterFn: (doc) => true,
        resyncElastic: false,
      },
    },
  },
  posts: {
    graphql: {
      type: "[Post]",
      canRead: ["guests"],
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
      type: "Float",
      canRead: ["guests"],
      onCreate: () => 0,
      countOfReferences: {
        foreignCollectionName: "Comments",
        foreignFieldName: "userId",
        filterFn: (comment) => !comment.deleted && !comment.rejected,
        resyncElastic: true,
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
      type: "Float",
      canRead: ["guests"],
      onCreate: getFillIfMissing(0),
      onUpdate: throwIfSetToNull,
      countOfReferences: {
        foreignCollectionName: "Comments",
        foreignFieldName: "userId",
        filterFn: (doc) => true,
        resyncElastic: false,
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
      type: "Float",
      canRead: ["guests"],
      onCreate: () => 0,
      countOfReferences: {
        foreignCollectionName: "Revisions",
        foreignFieldName: "userId",
        filterFn: (revision) => revision.collectionName === "Tags",
        resyncElastic: false,
      },
    },
  },
  abTestKey: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: ["admins"],
      onCreate: ({ document, context }) => {
        if (!document.abTestKey) {
          return getUserABTestKey({
            clientId: context.clientId ?? randomId(),
          });
        }
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
      type: "JSON",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
    },
  },
  reenableDraftJs: {
    database: {
      type: "BOOL",
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
    },
    form: {
      order: 73,
      label: "Restore the previous WYSIWYG editor",
      tooltip: "Restore the old Draft-JS based editor",
      hidden: false,
      group: () => formGroups.siteCustomizations,
    },
  },
  walledGardenInvite: {
    database: {
      type: "BOOL",
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins"],
    },
  },
  hideWalledGardenUI: {
    database: {
      type: "BOOL",
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
    },
  },
  walledGardenPortalOnboarded: {
    database: {
      type: "BOOL",
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
    },
  },
  taggingDashboardCollapsed: {
    database: {
      type: "BOOL",
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
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
      type: "Boolean",
      canRead: ["members"],
      canUpdate: ["sunshineRegiment", "admins"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
  },
  paymentEmail: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "admins"],
    },
  },
  paymentInfo: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "admins"],
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
      type: "Date",
      canRead: ["guests"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(new Date(0)),
      onUpdate: throwIfSetToNull,
    },
  },
  profileImageId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "admins", "sunshineRegiment"],
    },
  },
  jobTitle: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
    },
  },
  organization: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
    },
  },
  careerStage: {
    database: {
      type: "TEXT[]",
    },
    graphql: {
      type: "[String]",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
    },
  },
  website: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
    },
  },
  bio: {
    graphql: {
      type: "String",
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
      type: "String!",
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
      type: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
    },
  },
  linkedinProfileURL: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
    },
  },
  facebookProfileURL: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
    },
  },
  blueskyProfileURL: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
    },
  },
  twitterProfileURL: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
    },
  },
  twitterProfileURLAdmin: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      type: "String",
      canRead: ["sunshineRegiment", "admins"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["members"],
    },
    form: {
      form: {
        inputPrefix: () => SOCIAL_MEDIA_PROFILE_FIELDS.twitterProfileURL,
        heading: "Social media (private, for admin use)",
        smallBottomMargin: false,
      },
      order: 11,
      control: "PrefixedInput",
      hidden: false,
      group: () => formGroups.adminOptions,
    },
  },
  githubProfileURL: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
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
      type: "[String]",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      onCreate: arrayOfForeignKeysOnCreate,
    },
  },
  profileTags: {
    graphql: {
      type: "[Tag!]!",
      canRead: ["guests"],
      resolver: generateIdResolverMulti({ collectionName: "Users", fieldName: "profileTagIds" }),
    },
    form: {
      hidden: true,
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
      type: "[String]",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      onCreate: arrayOfForeignKeysOnCreate,
    },
  },
  organizerOfGroups: {
    graphql: {
      type: "[Localgroup!]!",
      canRead: ["guests"],
      resolver: generateIdResolverMulti({ collectionName: "Users", fieldName: "organizerOfGroupIds" }),
    },
    form: {
      hidden: true,
    },
  },
  programParticipation: {
    database: {
      type: "TEXT[]",
    },
    graphql: {
      type: "[String]",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
    },
  },
  postingDisabled: {
    database: {
      type: "BOOL",
    },
    graphql: {
      type: "Boolean",
      canRead: ["members"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
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
      type: "Boolean",
      canRead: ["members"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
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
      type: "Boolean",
      canRead: ["members"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
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
      type: "Boolean",
      canRead: ["members"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
    },
    form: {
      order: 72,
      control: "checkbox",
      group: () => formGroups.disabledPrivileges,
    },
  },
  associatedClientId: {
    graphql: {
      type: "ClientId",
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
      type: "[ClientId!]",
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
      type: "Boolean",
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
    },
  },
  moderatorActions: {
    graphql: {
      type: "[ModeratorAction]",
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
      type: "String",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      validation: {
        allowedValues: ["card", "list"],
      },
    },
  },
  hideJobAdUntil: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      type: "Date",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members"],
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
      type: "Boolean",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
    form: {
      label: "Hide my profile from the People directory",
      hidden: false,
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
    form: {
      label: "Allow Session Replay",
      tooltip:
        "Allow us to capture a video-like recording of your browser session (using Datadog Session Replay) — this is useful for debugging and improving the site.",
      hidden: false,
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
      type: "Float",
      canRead: ["guests"],
      onCreate: () => 0,
      countOfReferences: {
        foreignCollectionName: "Posts",
        foreignFieldName: "userId",
        filterFn: (post) => post.af && !post.draft && post.status === postStatuses.STATUS_APPROVED,
        resyncElastic: false,
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
      type: "Float",
      canRead: ["guests"],
      onCreate: () => 0,
      countOfReferences: {
        foreignCollectionName: "Comments",
        foreignFieldName: "userId",
        filterFn: (comment) => comment.af,
        resyncElastic: false,
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
      type: "Float",
      canRead: ["guests"],
      onCreate: () => 0,
      countOfReferences: {
        foreignCollectionName: "Sequences",
        foreignFieldName: "userId",
        filterFn: (sequence) => sequence.af && !sequence.draft && !sequence.isDeleted,
        resyncElastic: false,
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
      type: "Float",
      canRead: ["guests"],
      onCreate: () => 0,
      countOfReferences: {
        foreignCollectionName: "Sequences",
        foreignFieldName: "userId",
        filterFn: (sequence) => sequence.af && sequence.draft && !sequence.isDeleted,
        resyncElastic: false,
      },
    },
  },
  reviewForAlignmentForumUserId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["alignmentForumAdmins", "admins"],
      canCreate: ["alignmentForumAdmins", "admins"],
    },
  },
  afApplicationText: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: [userOwns, "alignmentForumAdmins", "admins"],
      canUpdate: [userOwns, "admins"],
    },
  },
  afSubmittedApplication: {
    database: {
      type: "BOOL",
    },
    graphql: {
      type: "Boolean",
      canRead: [userOwns, "alignmentForumAdmins", "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["admins"],
    },
  },
  rateLimitNextAbleToComment: {
    graphql: {
      type: "JSON",
      canRead: ["guests"],
      resolver: async (user, args, context) => {
        return rateLimitDateWhenUserNextAbleToComment(user, args.postId, context);
      },
    },
  },
  rateLimitNextAbleToPost: {
    graphql: {
      type: "JSON",
      canRead: ["guests"],
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
      type: "JSON",
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
      type: "Boolean",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
  },
  inactiveSurveyEmailSentAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      type: "Date",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["members"],
    },
  },
  userSurveyEmailSentAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      type: "Date",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["members"],
    },
  },
  karmaChanges: {
    graphql: {
      type: "KarmaChanges",
      canRead: function (user, document) {
        if (!user) {
          // not logged in
          return false;
        }
        if (!document) {
          // no document specified
          return false;
        }
        if (document.userId) {
          // case 1: document is a post or a comment, use userId to check
          return user._id === document.userId;
        } else {
          // case 2: document is a user, use _id or slug to check
          const documentUser = document;
          const idsExistAndMatch = !!user._id && !!documentUser._id && user._id === documentUser._id;
          const slugsExistAndMatch = !!user.slug && !!documentUser.slug && user.slug === documentUser.slug;
          return idsExistAndMatch || slugsExistAndMatch;
        }
      },
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
      type: "JSON",
      canRead: [userOwns],
      canUpdate: [userOwns],
      validation: {
        simpleSchema: FILL_THIS_IN,
      },
    },
  },
};

export default schema;
