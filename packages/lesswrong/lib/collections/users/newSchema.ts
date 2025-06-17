import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LATEST_REVISION_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import SimpleSchema from "simpl-schema";
import {
  userGetProfileUrl,
  getUserEmail,
  userOwnsAndInGroup, getAuth0Provider,
  karmaChangeUpdateFrequencies,
} from "./helpers";
import { userGetEditUrl } from "../../vulcan-users/helpers";
import { userOwns, userIsAdmin, userHasntChangedName } from "../../vulcan-users/permissions";
import * as _ from "underscore";
import { isAF, isEAForum, verifyEmailsSetting } from "../../instanceSettings";
import {
  accessFilterMultiple, arrayOfForeignKeysOnCreate, generateIdResolverMulti,
  generateIdResolverSingle,
  getDenormalizedCountOfReferencesGetValue,
  getDenormalizedFieldOnCreate,
  getDenormalizedFieldOnUpdate,
  googleLocationToMongoLocation,
} from "../../utils/schemaUtils";
import { postStatuses } from "../posts/constants";
import { REVIEW_YEAR } from "../../reviewUtils";
import uniqBy from "lodash/uniqBy";
import { userThemeSettings } from "../../../themes/themeNames";
import { randomId } from "../../random";
import { getUserABTestKey } from "../../abTestImpl";
import { getNestedProperty } from "../../vulcan-lib/utils";
import { getDenormalizedEditableResolver } from "@/lib/editor/make_editable";
import { RevisionStorageType } from "../revisions/revisionSchemaTypes";
import { markdownToHtml, dataToMarkdown } from "@/server/editor/conversionUtils";
import { getKarmaChangeDateRange, getKarmaChangeNextBatchDate, getKarmaChanges } from "@/server/karmaChanges";
import { rateLimitDateWhenUserNextAbleToComment, rateLimitDateWhenUserNextAbleToPost, getRecentKarmaInfo } from "@/server/rateLimitUtils";
import GraphQLJSON from "graphql-type-json";
import gql from "graphql-tag";
import { bothChannelsEnabledNotificationTypeSettings, dailyEmailBatchNotificationSettingOnCreate, defaultNotificationTypeSettings, emailEnabledNotificationSettingOnCreate, notificationTypeSettingsSchema } from "./notificationFieldHelpers";
import { loadByIds } from "@/lib/loaders";

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

export const createDisplayName = (user: Partial<DbUser> | Partial<DbInsertion<DbUser>> | CreateUserDataInput | UpdateUserDataInput): string => {
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

const ownsOrIsAdmin = (user: DbUser | null, document: any) => {
  return userOwns(user, document) || userIsAdmin(user);
};

const ownsOrIsMod = (user: DbUser | null, document: any) => {
  return userOwns(user, document) || userIsAdmin(user) || (user?.groups?.includes("sunshineRegiment") ?? false);
};

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

export type RateLimitReason = "moderator" | "lowKarma" | "downvoteRatio" | "universal";

export const graphqlTypeDefs = gql`
  type LatLng {
    lat: Float!
    lng: Float!
  }

  input ExpandedFrontpageSectionsSettingsInput {
    community: Boolean
    recommendations: Boolean
    quickTakes: Boolean
    quickTakesCommunity: Boolean
    popularComments: Boolean
  }

  type ExpandedFrontpageSectionsSettingsOutput {
    community: Boolean
    recommendations: Boolean
    quickTakes: Boolean
    quickTakesCommunity: Boolean
    popularComments: Boolean
  }

  input PartiallyReadSequenceItemInput {
    sequenceId: String
    collectionId: String
    lastReadPostId: String!
    nextPostId: String!
    numRead: Int!
    numTotal: Int!
    lastReadTime: Date
  }

  type PartiallyReadSequenceItemOutput {
    sequenceId: String
    collectionId: String
    lastReadPostId: String
    nextPostId: String
    numRead: Int
    numTotal: Int
    lastReadTime: Date
  }

  input PostMetadataInput {
    postId: String!
  }

  type PostMetadataOutput {
    postId: String!
  }

  input RecommendationAlgorithmSettingsInput {
    method: String!
    count: Int!
    scoreOffset: Float!
    scoreExponent: Float!
    personalBlogpostModifier: Float!
    frontpageModifier: Float!
    curatedModifier: Float!
    onlyUnread: Boolean!
  }

  input RecommendationSettingsInput {
    frontpage: RecommendationAlgorithmSettingsInput!
    frontpageEA: RecommendationAlgorithmSettingsInput!
    recommendationspage: RecommendationAlgorithmSettingsInput!
  }
`;

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
      inputType: "CreateRevisionDataInput",
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
      inputType: "CreateRevisionDataInput",
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
      inputType: "CreateRevisionDataInput",
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
      inputType: "CreateRevisionDataInput",
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
  // TODO(EA): Allow resending of confirmation email
  whenConfirmationEmailSent: {
    database: {
      type: "TIMESTAMPTZ",
    },
    graphql: {
      outputType: "Date",
      canRead: ["members"],
      // Setting this will trigger a verification email to be sent (unless `verifyEmailsSetting` is false, in which case it does nothing)
      canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
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
      outputType: "Boolean!",
      inputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
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
  },
  expandedFrontpageSections: {
    database: {
      type: "JSONB",
      nullable: true,
    },
    graphql: {
      outputType: "ExpandedFrontpageSectionsSettingsOutput",
      inputType: "ExpandedFrontpageSectionsSettingsInput",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
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
      // The old schema had the below comment:
      // FIXME this isn't filling default values as intended
      // ...schemaDefaultValue(getDefaultFilterSettings),
      // It'd need to be converted to an `onCreate`, or something, but it doesn't seem to be causing any problems by its lack.
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
  },
  bookmarkedPostsMetadata: {
    graphql: {
      outputType: "[PostMetadataOutput!]",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      resolver: async (user: DbUser, args: unknown, context: ResolverContext) => {
        const { Bookmarks } = context;
        const bookmarks = await Bookmarks.find({ 
          userId: user._id, 
          collectionName: "Posts",
          active: true 
        }, 
        {sort: {lastUpdated: -1}}
        ).fetch();
        return bookmarks.map((bookmark: DbBookmark) => ({ postId: bookmark.documentId }));
      },
    },
  },
  bookmarkedPosts: {
    graphql: {
      outputType: "[Post!]",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      resolver: async (user: DbUser, args: unknown, context: ResolverContext) => {
        const { Bookmarks, currentUser } = context;
        const bookmarks = await Bookmarks.find({ 
          userId: user._id, 
          collectionName: "Posts",
          active: true 
        }, 
        {sort: {lastUpdated: -1}}
        ).fetch();
        const postIds = bookmarks.map((bookmark: DbBookmark) => bookmark.documentId);
        if (postIds.length === 0) {
          return [];
        }
        const posts = await loadByIds(context, "Posts", postIds)
        return await accessFilterMultiple(currentUser, "Posts", posts, context);
      },
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
      outputType: "[PostMetadataOutput!]",
      inputType: "[PostMetadataInput!]",
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
  },
  notificationPostsInGroups: {
    database: {
      type: "JSONB",
      defaultValue: bothChannelsEnabledNotificationTypeSettings,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
  },
  notificationSubscribedTagPost: {
    database: {
      type: "JSONB",
      defaultValue: defaultNotificationTypeSettings,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
  },
  notificationSubscribedSequencePost: {
    database: {
      type: "JSONB",
      defaultValue: bothChannelsEnabledNotificationTypeSettings,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
  },
  notificationPrivateMessage: {
    database: {
      type: "JSONB",
      defaultValue: bothChannelsEnabledNotificationTypeSettings,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
  },
  notificationSharedWithMe: {
    database: {
      type: "JSONB",
      defaultValue: bothChannelsEnabledNotificationTypeSettings,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
  },
  notificationAlignmentSubmissionApproved: {
    database: {
      type: "JSONB",
      defaultValue: bothChannelsEnabledNotificationTypeSettings,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
  },
  notificationEventInRadius: {
    database: {
      type: "JSONB",
      defaultValue: bothChannelsEnabledNotificationTypeSettings,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
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
  },
  notificationRSVPs: {
    database: {
      type: "JSONB",
      defaultValue: bothChannelsEnabledNotificationTypeSettings,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
  },
  notificationGroupAdministration: {
    database: {
      type: "JSONB",
      defaultValue: bothChannelsEnabledNotificationTypeSettings,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
  },
  notificationCommentsOnDraft: {
    database: {
      type: "JSONB",
      defaultValue: bothChannelsEnabledNotificationTypeSettings,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
  },
  notificationPostsNominatedReview: {
    database: {
      type: "JSONB",
      defaultValue: bothChannelsEnabledNotificationTypeSettings,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
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
  },
  notificationNewPingback: {
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
  },
  notificationDialogueMessages: {
    database: {
      type: "JSONB",
      defaultValue: bothChannelsEnabledNotificationTypeSettings,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
  },
  notificationPublishedDialogueMessages: {
    database: {
      type: "JSONB",
      defaultValue: defaultNotificationTypeSettings,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
  },
  notificationAddedAsCoauthor: {
    database: {
      type: "JSONB",
      defaultValue: bothChannelsEnabledNotificationTypeSettings,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
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
  },
  notificationDebateReplies: {
    database: {
      type: "JSONB",
      defaultValue: defaultNotificationTypeSettings,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
  },
  notificationDialogueMatch: {
    database: {
      type: "JSONB",
      defaultValue: bothChannelsEnabledNotificationTypeSettings,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
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
  },
  notificationYourTurnMatchForm: {
    database: {
      type: "JSONB",
      defaultValue: defaultNotificationTypeSettings,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: DEFAULT_NOTIFICATION_GRAPHQL_OPTIONS,
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
  },
  partiallyReadSequences: {
    database: {
      type: "JSONB[]",
    },
    graphql: {
      outputType: "[PartiallyReadSequenceItemOutput!]",
      inputType: "[PartiallyReadSequenceItemInput!]",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns],
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
      canUpdate: [userOwns, "admins"], // only editable by changing the setting from the subforum page
      canCreate: ["members", "admins"],
      validation: {
        allowedValues: ["card", "list"],
        optional: true,
      },
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
      // I've only set the input type here because I don't know that all the existing data conforms to the schema.
      inputType: "RecommendationSettingsInput",
      canRead: [userOwns],
      canUpdate: [userOwns],
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"Users">>;

export default schema;
