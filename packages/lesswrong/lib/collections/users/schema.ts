import SimpleSchema from 'simpl-schema';
import {userGetProfileUrl, getUserEmail, userOwnsAndInGroup, SOCIAL_MEDIA_PROFILE_FIELDS, getAuth0Provider } from "./helpers";
import { userGetEditUrl } from '../../vulcan-users/helpers';
import { getAllUserGroups, userOwns, userIsAdmin, userHasntChangedName } from '../../vulcan-users/permissions';
import { formGroups } from './formGroups';
import * as _ from 'underscore';
import { hasEventsSetting, isAF, isEAForum, isLW, isLWorAF, taggingNamePluralSetting, verifyEmailsSetting } from "../../instanceSettings";
import { accessFilterMultiple, arrayOfForeignKeysField, denormalizedCountOfReferences, denormalizedField, foreignKeyField, googleLocationToMongoLocation, resolverOnlyField, schemaDefaultValue } from '../../utils/schemaUtils';
import { postStatuses } from '../posts/constants';
import GraphQLJSON from 'graphql-type-json';
import { REVIEW_NAME_IN_SITU, REVIEW_YEAR } from '../../reviewUtils';
import uniqBy from 'lodash/uniqBy'
import { userThemeSettings, defaultThemeOptions } from "../../../themes/themeNames";
import { postsLayouts } from '../posts/dropdownOptions';
import type { ForumIconName } from '../../../components/common/ForumIcon';
import { getCommentViewOptions } from '../../commentViewOptions';
import { allowSubscribeToSequencePosts, allowSubscribeToUserComments, dialoguesEnabled, hasAccountDeletionFlow, hasPostRecommendations, hasSurveys, userCanViewJargonTerms } from '../../betas';
import { TupleSet, UnionOf } from '../../utils/typeGuardUtils';
import { randomId } from '../../random';
import { getUserABTestKey } from '../../abTestImpl';
import { isFriendlyUI } from '../../../themes/forumTheme';
import { DeferredForumSelect } from '../../forumTypeUtils';
import { getNestedProperty } from "../../vulcan-lib/utils";
import { addGraphQLSchema } from "../../vulcan-lib/graphql";

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
  const profileName = getNestedProperty(user, 'profile.name');
  const twitterName = getNestedProperty(user, 'services.twitter.screenName');
  const linkedinFirstName = getNestedProperty(user, 'services.linkedin.firstName');
  const email = getUserEmail(user)
  if (profileName) return profileName;
  if (twitterName) return twitterName;
  if (linkedinFirstName)
    return `${linkedinFirstName} ${getNestedProperty(user, 'services.linkedin.lastName')}`;
  if (user.username) return user.username;
  if (email) return email.slice(0, email.indexOf('@'));
  return "[missing username]";
};

const adminGroup = {
  name: 'admin',
  order: 100,
  label: "Admin",
};

const ownsOrIsAdmin = (user: DbUser|null, document: any) => {
  return userOwns(user, document) || userIsAdmin(user);
};

const ownsOrIsMod = (user: DbUser|null, document: any) => {
  return userOwns(user, document) || userIsAdmin(user) || (user?.groups?.includes('sunshineRegiment') ?? false);
};

export const REACT_PALETTE_STYLES = ['listView', 'gridView'];


export const MAX_NOTIFICATION_RADIUS = 300


export type NotificationChannelOption = "none"|"onsite"|"email"|"both"
export type NotificationBatchingOption = "realtime"|"daily"|"weekly"

export type NotificationTypeSettings = {
  channel: NotificationChannelOption,
  batchingFrequency: NotificationBatchingOption,
  timeOfDayGMT: number,
  dayOfWeekGMT: string // "Monday"|"Tuesday"|"Wednesday"|"Thursday"|"Friday"|"Saturday"|"Sunday",
};

export const defaultNotificationTypeSettings: NotificationTypeSettings = {
  channel: "onsite",
  batchingFrequency: "realtime",
  timeOfDayGMT: 12,
  dayOfWeekGMT: "Monday",
};

const rateLimitInfoSchema = new SimpleSchema({
  nextEligible: {
    type: Date
  },
  rateLimitType: {
    type: String,
    allowedValues: ["moderator", "lowKarma", "universal", "downvoteRatio"]
  },
  rateLimitMessage: {
    type: String
  },
})

const karmaChangeUpdateFrequencies = new TupleSet([
  "disabled",
  "daily",
  "weekly",
  "realtime",
] as const);

export type KarmaChangeUpdateFrequency = UnionOf<typeof karmaChangeUpdateFrequencies>;

export interface KarmaChangeSettingsType {
  updateFrequency: KarmaChangeUpdateFrequency
  /**
   * Time of day at which daily/weekly batched updates are released. A number of hours [0,24), always in GMT.
   */
  timeOfDayGMT: number
  dayOfWeekGMT: "Monday"|"Tuesday"|"Wednesday"|"Thursday"|"Friday"|"Saturday"|"Sunday"
  showNegativeKarma: boolean
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
    max: 23
  },
  dayOfWeekGMT: {
    type: String,
    optional: true,
    allowedValues: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  showNegativeKarma: {
    type: Boolean,
    optional: true,
  }
})

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
    allowedValues: ['realtime', 'daily', 'weekly'],
  },
  timeOfDayGMT: {
    type: Number,
    optional: true,
  },
  dayOfWeekGMT: {
    type: String,
    optional: true,
  },
})

const expandedFrontpageSectionsSettings = new SimpleSchema({
  community: {type: Boolean, optional: true, nullable: true},
  recommendations: {type: Boolean, optional: true, nullable: true},
  quickTakes: {type: Boolean, optional: true, nullable: true},
  quickTakesCommunity: {type: Boolean, optional: true, nullable: true},
  popularComments: {type: Boolean, optional: true, nullable: true},
});

const notificationTypeSettingsField = (overrideSettings?: Partial<NotificationTypeSettings>) => ({
  type: notificationTypeSettings,
  optional: true,
  group: formGroups.notifications,
  control: "NotificationTypeSettingsWidget" as const,
  canRead: [userOwns, 'admins'] as FieldPermissions,
  canUpdate: [userOwns, 'admins'] as FieldPermissions,
  canCreate: ['members', 'admins'] as FieldCreatePermissions,
  ...schemaDefaultValue({ ...defaultNotificationTypeSettings, ...overrideSettings })
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
  'highSchool'|
  'associateDegree'|
  'undergradDegree'|
  'professionalDegree'|
  'graduateDegree'|
  'doctoralDegree'|
  'otherDegree'|
  'earlyCareer'|
  'midCareer'|
  'lateCareer'|
  'seekingWork'|
  'retired'

// list of career stage options from EAG
type EAGCareerStage =
  'Student (high school)'|
  'Pursuing an associates degree'|
  'Pursuing an undergraduate degree'|
  'Pursuing a professional degree'|
  'Pursuing a graduate degree (e.g. Masters)'|
  'Pursuing a doctoral degree (e.g. PhD)'|
  'Pursuing other degree/diploma'|
  'Working (0-5 years of experience)'|
  'Working (6-15 years of experience)'|
  'Working (15+ years of experience)'|
  'Not employed, but looking'|
  'Retired'

type CareerStage = {
  value: CareerStageValue,
  label: string,
  icon: ForumIconName,
  EAGLabel: EAGCareerStage
}

export const CAREER_STAGES: CareerStage[] = [
  {value: 'highSchool', label: "In high school", icon: "School", EAGLabel: 'Student (high school)'},
  {value: 'associateDegree', label: "Pursuing an associate's degree", icon: "School", EAGLabel: 'Pursuing an associates degree'},
  {value: 'undergradDegree', label: "Pursuing an undergraduate degree", icon: "School", EAGLabel: 'Pursuing an undergraduate degree'},
  {value: 'professionalDegree', label: "Pursuing a professional degree", icon: "School", EAGLabel: 'Pursuing a professional degree'},
  {value: 'graduateDegree', label: "Pursuing a graduate degree (e.g. Master's)", icon: "School", EAGLabel: 'Pursuing a graduate degree (e.g. Masters)'},
  {value: 'doctoralDegree', label: "Pursuing a doctoral degree (e.g. PhD)", icon: "School", EAGLabel: 'Pursuing a doctoral degree (e.g. PhD)'},
  {value: 'otherDegree', label: "Pursuing other degree/diploma", icon: "School", EAGLabel: 'Pursuing other degree/diploma'},
  {value: 'earlyCareer', label: "Working (0-5 years)", icon: "Work", EAGLabel: 'Working (0-5 years of experience)'},
  {value: 'midCareer', label: "Working (6-15 years)", icon: "Work", EAGLabel: 'Working (6-15 years of experience)'},
  {value: 'lateCareer', label: "Working (15+ years)", icon: "Work", EAGLabel: 'Working (6-15 years of experience)'},
  {value: 'seekingWork', label: "Seeking work", icon: "Work", EAGLabel: 'Not employed, but looking'},
  {value: 'retired', label: "Retired", icon: "Work", EAGLabel: 'Retired'},
]

export const PROGRAM_PARTICIPATION = [
  {value: 'vpIntro', label: "Completed the Introductory EA Virtual Program"},
  {value: 'vpInDepth', label: "Completed the In-Depth EA Virtual Program"},
  {value: 'vpPrecipice', label: "Completed the Precipice Reading Group"},
  {value: 'vpLegal', label: "Completed the Legal Topics in EA Virtual Program"},
  {value: 'vpAltProtein', label: "Completed the Alt Protein Fundamentals Virtual Program"},
  {value: 'vpAGISafety', label: "Completed the AGI Safety Fundamentals Virtual Program"},
  {value: 'vpMLSafety', label: "Completed the ML Safety Scholars Virtual Program"},
  {value: 'eag', label: "Attended an EA Global conference"},
  {value: 'eagx', label: "Attended an EAGx conference"},
  {value: 'localgroup', label: "Attended more than three meetings with a local EA group"},
  {value: '80k', label: "Received career coaching from 80,000 Hours"},
]

export type RateLimitReason = "moderator"|"lowKarma"|"downvoteRatio"|"universal"

type LatLng = {
  lat: number
  lng: number
};
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
const schema: SchemaType<"Users"> = {
  username: {
    type: String,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['members'],
    hidden: true,
    onCreate: ({document: user}) => {
      if (!user.username && user.services?.twitter?.screenName) {
        return user.services.twitter.screenName;
      }
    },
  },
  // Emails (not to be confused with email). This field belongs to Meteor's
  // accounts system; we should never write it, but we do need to read it to find
  // out whether a user's email address is verified.
  // FIXME: Update this comment
  emails: {
    type: Array,
    optional: true,
    hidden: true,
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    
    // FIXME
    // This is dead code and doesn't actually run, but we do have to implement something like this in a post Meteor world
    onCreate: ({document: user}) => {
    
      const oAuthEmail = getNestedProperty(user, 'services.facebook.email') |
        getNestedProperty(user, 'services.google.email') | 
        getNestedProperty(user, 'services.github.email') | 
        getNestedProperty(user, 'services.linkedin.emailAddress')
      
      if (oAuthEmail) {
        return [{address: oAuthEmail, verified: true}]
      }
    }
  },
  'emails.$': {
    type: Object,
    optional: true,
  },
  'emails.$.address': {
    type: String,
    regEx: SimpleSchema.RegEx.Email,
    optional: true,
  },
  // NB: Not used on the EA Forum
  'emails.$.verified': {
    type: Boolean,
    optional: true,
  },
  isAdmin: {
    type: Boolean,
    label: 'Admin',
    control: 'checkbox',
    optional: true,
    canCreate: ['admins'],
    canUpdate: ['admins','realAdmins'],
    canRead: ['guests'],
    ...schemaDefaultValue(false),
    group: adminGroup,
  },
  profile: {
    type: Object,
    optional: true,
    blackbox: true,
    hidden: true,
    canCreate: ['members'],
  },
  // // telescope-specific data, kept for backward compatibility and migration purposes
  // telescope: {
  //   type: Object,
  //   blackbox: true,
  //   optional: true,
  // },
  services: {
    type: Object,
    optional: true,
    blackbox: true,
    canRead: ownsOrIsAdmin
  },
  /** hasAuth0Id: true if they use auth0 with username/password login, false otherwise */
  hasAuth0Id: resolverOnlyField({
    type: Boolean,
    // Mods cannot read because they cannot read services, which is a prerequisite
    canRead: [userOwns, 'admins'],
    resolver: (user: DbUser) => {
      return getAuth0Provider(user) === 'auth0';
    },
  }),
  // The name displayed throughout the app. Can contain spaces and special characters, doesn't need to be unique
  // Hide the option to change your displayName (for now) TODO: Create proper process for changing name
  displayName: {
    type: String,
    hidden: isFriendlyUI,
    optional: true,
    // On the EA Forum name changing is rate limited in rateLimitCallbacks
    canUpdate: ['sunshineRegiment', 'admins', isEAForum ? 'members' : userHasntChangedName],
    canCreate: ['sunshineRegiment', 'admins'],
    canRead: ['guests'],
    order: 10,
    onCreate: ({ document: user }) => {
      return user.displayName || createDisplayName(user);
    },
    group: formGroups.default,
    control: isFriendlyUI ? "FormComponentFriendlyDisplayNameInput" : undefined,
  },
  /**
   Used for tracking changes of displayName
   */
  previousDisplayName: {
    type: String,
    optional: true,
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    order: 11,
    group: formGroups.default,
  },
  /**
    The user's email. Modifiable.
  */
  email: {
    type: String,
    optional: true,
    regEx: SimpleSchema.RegEx.Email,
    control: 'text',
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canRead: ownsOrIsMod,
    order: 20,
    group: formGroups.default,
    onCreate: ({ document: user }) => {
      // look in a few places for the user email
      const facebookEmail: any = getNestedProperty(user, 'services.facebook.email');
      const githubEmail: any = getNestedProperty(user, 'services.github.email');
      const googleEmail: any = getNestedProperty(user, 'services.google.email');
      const linkedinEmail: any = getNestedProperty(user, 'services.linkedin.emailAddress');

      if (facebookEmail) return facebookEmail;
      if (githubEmail) return githubEmail;
      if (googleEmail) return googleEmail;
      if (linkedinEmail) return linkedinEmail;
      return undefined;
    },
    onUpdate: (props) => {
      const {data, document, oldDocument} = props;
      if (oldDocument.email?.length && !document.email) {
        throw new Error("You cannot remove your email address");
      }
      return data.email;
    },
    form: {
      // Will always be disabled for mods, because they cannot read hasAuth0Id
      disabled: ({document}: AnyBecauseTodo) => isEAForum && !document.hasAuth0Id,
    },
    // unique: true // note: find a way to fix duplicate accounts before enabling this
  },
  
  noindex: {
    type: Boolean,
    optional: true,
    ...schemaDefaultValue(false),
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    order: 48,
    group: formGroups.adminOptions,
    label: "No Index",
    tooltip: "Hide this user's profile from search engines",
  },
  
  /**
    Groups
  */
  groups: {
    type: Array,
    optional: true,
    control: 'checkboxgroup',
    canCreate: ['admins'],
    canUpdate: ['alignmentForumAdmins', 'admins', 'realAdmins'],
    canRead: ['guests'],
    group: adminGroup,
    form: {
      options: function() {
        const groups = _.without(
          _.keys(getAllUserGroups),
          'guests',
          'members',
          'admins'
        );
        return groups.map(group => {
          return { value: group, label: group };
        });
      },
    },
  },
  'groups.$': {
    type: String,
    optional: true,
  },

  // GraphQL only fields

  pageUrl: {
    type: String,
    optional: true,
    canRead: ['guests'],
    resolveAs: {
      type: 'String',
      resolver: (user: DbUser, args: void, context: ResolverContext): string => {
        return userGetProfileUrl(user, true);
      },
    },
  },

  pagePath: {
    type: String,
    optional: true,
    canRead: ['guests'],
    resolveAs: {
      type: 'String',
      resolver: (user: DbUser, args: void, context: ResolverContext): string => {
        return userGetProfileUrl(user, false);
      },
    },
  },

  editUrl: {
    type: String,
    optional: true,
    canRead: ['guests'],
    resolveAs: {
      type: 'String',
      resolver: (user: DbUser, args: void, context: ResolverContext): string => {
        return userGetEditUrl(user, true);
      },
    },
  },
  lwWikiImport: {
    type: Boolean,
    optional: true, 
    canRead: ['guests'],
  },
  
  theme: {
    type: userTheme,
    optional: true,
    nullable: true,
    ...schemaDefaultValue(defaultThemeOptions),
    canCreate: ['members'],
    canUpdate: ownsOrIsAdmin,
    canRead: ownsOrIsAdmin,
    hidden: isLWorAF,
    control: "ThemeSelect",
    order: 1,
    group: formGroups.siteCustomizations,
  },
  
  lastUsedTimezone: {
    type: String,
    optional: true,
    hidden: true,
    canCreate: ['members'],
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    canUpdate: [userOwns],
  },

  // TODO(EA): Allow resending of confirmation email
  whenConfirmationEmailSent: {
    type: Date,
    optional: true,
    order: 1,
    group: formGroups.emails,
    control: 'UsersEmailVerification',
    canRead: ['members'],
    // Editing this triggers a verification email, so don't allow editing on instances (like EAF) that don't use email verification
    canUpdate: verifyEmailsSetting.get()
      ? [userOwns, 'sunshineRegiment', 'admins']
      : [],
    canCreate: ['members'],
  },

  // Legacy: Boolean used to indicate that post was imported from old LW database
  legacy: {
    type: Boolean,
    optional: true,
    ...schemaDefaultValue(false),
    hidden: true,
    canRead: [userOwns, 'admins'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
  },

  commentSorting: {
    type: String,
    optional: true,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    order: 43,
    group: formGroups.siteCustomizations,
    control: "select",
    form: {
      // getCommentViewOptions has optional parameters so it's safer to wrap it
      // in a lambda. We don't currently enable admin-only sorting options for
      // admins - we could but it seems not worth the effort.
      options: () => getCommentViewOptions(),
    },
  },


  sortDraftsBy: {
    type: String,
    optional: true,
    canRead: [userOwns, 'admins'],
    canUpdate: [userOwns, 'admins'],
    label: "Sort Drafts by",
    order: 43,
    group: formGroups.siteCustomizations,
    control: "select",
    form: {
      options: function () { // options for the select form control
        return [
          {value:'wordCount', label: 'Wordcount'},
          {value:'modifiedAt', label: 'Last Modified'},
        ];
      }
    },
  },
  reactPaletteStyle: {
    type: String,
    optional: true,
    canRead: [userOwns, 'admins'],
    canUpdate: [userOwns, 'admins'],
    label: "React Palette Style",
    group: formGroups.siteCustomizations,
    allowedValues: ['listView', 'gridView'],
    ...schemaDefaultValue('listView'),
    hidden: isEAForum,
    control: "select",
    form: {
      options: function () { // options for the select form control
        return [
          {value:'listView', label: 'List View'},
          {value:'iconView', label: 'Icons'},
        ];
      }
    }
  },
  
  noKibitz: {
    type: Boolean,
    optional: true,
    label: "Hide author names until I hover over them",
    tooltip: "For if you want to not be biased. Adds an option to the user menu to temporarily disable. Does not work well on mobile",
    canRead: [userOwns, 'admins'],
    canUpdate: [userOwns, 'admins'],
    canCreate: ['members', 'admins'],
    group: formGroups.siteCustomizations,
    order: 68,
  },
  
  showHideKarmaOption: {
    type: Boolean,
    optional: true,
    label: "Enable option on posts to hide karma visibility",
    canRead: [userOwns, 'admins'],
    canUpdate: [userOwnsAndInGroup('trustLevel1'), 'sunshineRegiment', 'admins'],
    canCreate: ['members', 'sunshineRegiment', 'admins'],
    hidden: !isEAForum,
    control: 'checkbox',
    group: formGroups.siteCustomizations,
    order: 69,
  },
  
  // We tested this on the EA Forum and it didn't encourage more PMs, but it led to some profile views.
  // Hiding for now, will probably delete or test another version in the future.
  showPostAuthorCard: {
    type: Boolean,
    optional: true,
    label: "Show my bio at the end of my posts",
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    hidden: true,
    control: 'checkbox',
    group: formGroups.siteCustomizations,
    order: 70,
  },

  // Intercom: Will the user display the intercom while logged in?
  hideIntercom: {
    order: 71,
    type: Boolean,
    optional: true,
    ...schemaDefaultValue(false),
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    group: formGroups.siteCustomizations,
    canCreate: ['members'],
    control: 'checkbox',
    label: "Hide Intercom"
  },

  // This field-name is no longer accurate, but is here because we used to have that field
  // around and then removed `markDownCommentEditor` and merged it into this field.
  markDownPostEditor: {
    order: 72,
    type: Boolean,
    optional: true,
    ...schemaDefaultValue(false),
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    control: 'checkbox',
    group: formGroups.siteCustomizations,
    label: "Activate Markdown Editor"
  },

  hideElicitPredictions: {
    order: 80,
    type: Boolean,
    optional: true,
    ...schemaDefaultValue(false),
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    control: 'checkbox',
    group: formGroups.siteCustomizations,
    label: "Hide other users' Elicit predictions until I have predicted myself",
  },
  
  hideAFNonMemberInitialWarning: {
    order: 90,
    type: Boolean,
    optional: true,
    ...schemaDefaultValue(false),
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    control: 'checkbox',
    group: formGroups.siteCustomizations,
    hidden: !isAF,
    label: "Hide explanations of how AIAF submissions work for non-members", //TODO: just hide this in prod
  },
  
  noSingleLineComments: {
    order: 91,
    type: Boolean,
    optional: true,
    nullable: false,
    group: formGroups.siteCustomizations,
    ...schemaDefaultValue(false),
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    control: 'checkbox',
    label: "Do not collapse comments to Single Line"
  },

  noCollapseCommentsPosts: {
    order: 92,
    type: Boolean,
    optional: true,
    nullable: false,
    group: formGroups.siteCustomizations,
    ...schemaDefaultValue(false),
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    control: 'checkbox',
    label: "Do not truncate comments (in large threads on Post Pages)"
  },

  noCollapseCommentsFrontpage: {
    order: 93,
    type: Boolean,
    optional: true,
    nullable: false,
    group: formGroups.siteCustomizations,
    ...schemaDefaultValue(false),
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    control: 'checkbox',
    label: "Do not truncate comments (on home page)"
  },

  hideCommunitySection: {
    order: 93,
    type: Boolean,
    optional: true,
    nullable: false,
    hidden: !isEAForum,
    group: formGroups.siteCustomizations,
    ...schemaDefaultValue(false),
    canRead: ["guests"],
    canUpdate: [userOwns, "sunshineRegiment", "admins"],
    canCreate: ["members"],
    control: "checkbox",
    label: "Hide community section from the frontpage",
  },

  expandedFrontpageSections: {
    type: expandedFrontpageSectionsSettings,
    optional: true,
    nullable: true,
    hidden: true,
    canRead: [userOwns, "sunshineRegiment", "admins"],
    canUpdate: [userOwns, "sunshineRegiment", "admins"],
    canCreate: ["members"],
  },

  // On the EA Forum, we default to hiding posts tagged with "Community" from Recent Discussion
  showCommunityInRecentDiscussion: {
    order: 94,
    type: Boolean,
    optional: true,
    nullable: false,
    hidden: !isEAForum,
    group: formGroups.siteCustomizations,
    ...schemaDefaultValue(false),
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    control: 'checkbox',
    label: "Show Community posts in Recent Discussion"
  },

  hidePostsRecommendations: {
    order: 95,
    type: Boolean,
    optional: true,
    nullable: false,
    hidden: !hasPostRecommendations,
    group: formGroups.siteCustomizations,
    ...schemaDefaultValue(false),
    canRead: ["guests"],
    canUpdate: [userOwns, "sunshineRegiment", "admins"],
    canCreate: ["members"],
    control: "checkbox",
    label: "Hide recommendations from the posts page",
  },

  petrovOptOut: {
    order: 96,
    type: Boolean,
    optional: true,
    nullable: true,//TODO not-null – examine this
    group: formGroups.siteCustomizations,
    ...schemaDefaultValue(false),
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    control: 'checkbox',
    label: "Opt out of Petrov Day - you will not be able to launch",
    hidden: (new Date()).valueOf() > 1664161200000 
    // note this date is hard coded as a hack
    // we originally were using petrovBeforeTime but it didn't work in this file because the database
    // public settings aren't been loaded yet.
  },

  optedOutOfSurveys: {
    type: Boolean,
    optional: true,
    nullable: true,
    hidden: !hasSurveys,
    canCreate: ["members"],
    canRead: [userOwns, "sunshineRegiment", "admins"],
    canUpdate: [userOwns, "sunshineRegiment", "admins"],
    group: formGroups.siteCustomizations,
    label: "Opt out of user surveys",
    order: 97,
  },

  postGlossariesPinned: {
    type: Boolean,
    optional: true,
    hidden: (props) => userCanViewJargonTerms(props.currentUser),
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    group: formGroups.siteCustomizations,
    label: "Pin glossaries on posts, and highlight all instances of each term",
    order: 98,
    ...schemaDefaultValue(false),
  },

  generateJargonForDrafts: {
    type: Boolean,
    optional: true,
    hidden: true,
    canRead: ['members'],
    canUpdate: [userOwns],
    group: formGroups.siteCustomizations,
    ...schemaDefaultValue(false),
  },

  generateJargonForPublishedPosts: {
    type: Boolean,
    optional: true,
    hidden: true,
    group: formGroups.siteCustomizations,
    canRead: ['members'],
    canUpdate: [userOwns],
    ...schemaDefaultValue(true),
  },

  acceptedTos: {
    type: Boolean,
    optional: true,
    nullable: false,
    hidden: true,
    ...schemaDefaultValue(false),
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
  },

  hideNavigationSidebar: {
    type: Boolean,
    optional: true,
    canRead: userOwns,
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: 'guests',
    hidden: true,
  },
  currentFrontpageFilter: {
    type: String,
    optional: true,
    canRead: userOwns,
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: 'guests',
    hidden: true,
  },
  frontpageSelectedTab: {
    type: String,
    optional: true,
    nullable: true,
    canRead: userOwns,
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: 'guests',
    hidden: true,
  },
  frontpageFilterSettings: {
    type: Object,
    blackbox: true,
    optional: true,
    hidden: true,
    canRead: userOwns,
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: 'guests',
    // FIXME this isn't filling default values as intended
    // ...schemaDefaultValue(getDefaultFilterSettings),
  },
  hideFrontpageFilterSettingsDesktop: {
    type: Boolean,
    optional: true,
    nullable: true,
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: 'guests',
    hidden: true
  },
  allPostsTimeframe: {
    type: String,
    optional: true,
    canRead: userOwns,
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: 'guests',
    hidden: true,
  },
  allPostsFilter: {
    type: String,
    optional: true,
    canRead: userOwns,
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: 'guests',
    hidden: true,
  },
  allPostsSorting: {
    type: String,
    optional: true,
    hidden: true,
    canRead: userOwns,
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: 'guests',
  },
  allPostsShowLowKarma: {
    type: Boolean,
    optional: true,
    canRead: userOwns,
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: 'guests',
    hidden: true,
  },
  allPostsIncludeEvents: {
    type: Boolean,
    optional: true,
    canRead: userOwns,
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: 'guests',
    hidden: true,
  },
  allPostsHideCommunity: {
    type: Boolean,
    optional: true,
    canRead: userOwns,
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: 'guests',
    hidden: true,
  },
  allPostsOpenSettings: {
    type: Boolean,
    optional: true,
    canRead: userOwns,
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: 'guests',
    hidden: true,
  },
  draftsListSorting: {
    type: String,
    optional: true,
    hidden: true,
    canRead: userOwns,
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: 'guests',
  },
  draftsListShowArchived: {
    type: Boolean,
    optional: true,
    canRead: userOwns,
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: 'guests',
    hidden: true,
  },
  draftsListShowShared: {
    type: Boolean,
    optional: true,
    canRead: userOwns,
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: 'guests',
    hidden: true,
  },
  lastNotificationsCheck: {
    type: Date,
    optional: true,
    canRead: [userOwns, 'admins'],
    canUpdate: userOwns,
    canCreate: 'guests',
    hidden: true,
    logChanges: false,
  },

  // Karma field
  karma: {
    type: Number,
    optional: true,
    // TODO: add nullable: true
    canRead: ['guests'],
    ...schemaDefaultValue(0),
  },

  goodHeartTokens: {
    type: Number,
    optional: true,
    canRead: ['guests'],
  },

  moderationStyle: {
    type: String,
    optional: true,
    control: "select",
    group: formGroups.moderationGroup,
    hidden: isFriendlyUI,
    label: "Style",
    canRead: ['guests'],
    canUpdate: ['members', 'sunshineRegiment', 'admins'],
    canCreate: ['members', 'sunshineRegiment', 'admins'],
    blackbox: true,
    order: 55,
    form: {
      options: function () { // options for the select form control
        return [
          {value: "", label: "No Moderation"},
          {value: "easy-going", label: "Easy Going - I just delete obvious spam and trolling."},
          {value: "norm-enforcing", label: "Norm Enforcing - I try to enforce particular rules (see below)"},
          {value: "reign-of-terror", label: "Reign of Terror - I delete anything I judge to be annoying or counterproductive"},
        ];
      }
    },
  },

  moderatorAssistance: {
    type: Boolean,
    optional: true,
    group: formGroups.moderationGroup,
    hidden: isFriendlyUI,
    label: "I'm happy for site moderators to help enforce my policy",
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members', 'sunshineRegiment', 'admins'],
    control: 'checkbox',
    order: 55,
  },

  collapseModerationGuidelines: {
    type: Boolean,
    optional: true,
    group: formGroups.moderationGroup,
    label: "On my posts, collapse my moderation guidelines by default",
    hidden: isFriendlyUI,
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members', 'sunshineRegiment', 'admins'],
    control: 'checkbox',
    order: 56,
  },

  // bannedUserIds: users who are not allowed to comment on this user's posts
  bannedUserIds: {
    type: Array,
    group: formGroups.moderationGroup,
    canRead: ['guests'],
    canUpdate: [userOwnsAndInGroup('trustLevel1'), 'sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    optional: true,
    label: "Banned Users (All)",
    control: 'FormUserMultiselect'
  },
  'bannedUserIds.$': {
    type: String,
    foreignKey: "Users",
    optional: true
  },

  // bannedPersonalUserIds: users who are not allowed to comment on this user's personal blog posts
  bannedPersonalUserIds: {
    type: Array,
    group: formGroups.moderationGroup,
    canRead: ['guests'],
    canUpdate: [userOwnsAndInGroup('canModeratePersonal'), 'sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    optional: true,
    label: "Banned Users (Personal)",
    control: 'FormUserMultiselect',
    tooltip: "Users who are banned from commenting on your personal blogposts (will not affect posts promoted to frontpage)"
  },
  "bannedPersonalUserIds.$": {
    type: String,
    foreignKey: "Users",
    optional: true
  },

  bookmarkedPostsMetadata: {
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    optional: true,
    hidden: true,
    ...arrayOfForeignKeysField({
      idFieldName: "bookmarkedPostsMetadata",
      resolverName: "bookmarkedPosts",
      collectionName: "Posts",
      type: "Post",
      getKey: (obj) => obj.postId
    }),
    onUpdate: ({data, currentUser, oldDocument}) => {
      if (data?.bookmarkedPostsMetadata) {
        return _.uniq(data?.bookmarkedPostsMetadata, 'postId')
      }
    },
  },

  "bookmarkedPostsMetadata.$": {
    type: Object,
    optional: true
  },
  "bookmarkedPostsMetadata.$.postId": {
    type: String,
    foreignKey: "Posts",
    optional: true
  },

  // Note: this data model was chosen mainly for expediency: bookmarks has the same one, so we know it works,
  // and it was easier to add a property vs. making a new object. If the creator had more time, they'd instead
  // model this closer to ReadStatuses: an object per hidden thread + user pair, and exposing the hidden status
  // as a property on thread. 
  //
  // That said, this is likely fine given this is a power use feature, but if it ever gives anyone any problems
  // feel free to change it!
  hiddenPostsMetadata: {
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    optional: true,
    hidden: true,
    ...arrayOfForeignKeysField({
      idFieldName: "hiddenPostsMetadata",
      resolverName: "hiddenPosts",
      collectionName: "Posts",
      type: "Post",
      getKey: (obj) => obj.postId
    }),
    onUpdate: ({data, currentUser, oldDocument}) => {
      if (data?.hiddenPostsMetadata) {
        return uniqBy(data?.hiddenPostsMetadata, 'postId')
      }
    },
  },

  "hiddenPostsMetadata.$": {
    type: Object,
    optional: true
  },
  "hiddenPostsMetadata.$.postId": {
    type: String,
    foreignKey: "Posts",
    optional: true
  },

  // Legacy ID: ID used in the original LessWrong database
  legacyId: {
    type: String,
    hidden: true,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['members'],
  },

  // Deleted: Boolean indicating whether user has been deleted (initially used in the LW database transfer )
  deleted: {
    type: Boolean,
    optional: true,
    ...schemaDefaultValue(false),
    canRead: ['guests'],
    canUpdate: ['members', 'admins'],
    label: 'Deactivate',
    tooltip: "Your posts and comments will be listed as '[Anonymous]', and your user profile won't accessible.",
    control: 'checkbox',
    hidden: hasAccountDeletionFlow,
    group: formGroups.deactivate,
  },

  // permanentDeletionRequestedAt: The date the user requested their account to be permanently deleted,
  // it will be deleted by the script in packages/lesswrong/server/users/permanentDeletion.ts after a cooling
  // off period
  permanentDeletionRequestedAt: {
    type: Date,
    optional: true,
    nullable: true,
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    canUpdate: ['members', 'admins'],
    hidden: true, // Editing is handled outside a form
    onUpdate: ({data}) => {
      if (!data.permanentDeletionRequestedAt) return data.permanentDeletionRequestedAt;

      // Whenever the field is set, reset it to the current server time to ensure users
      // can't work around the cooling off period
      return new Date();
    },
  },

  // DEPRECATED
  // voteBanned: All future votes of this user have weight 0
  voteBanned: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['admins'],
    control: 'checkbox',
    group: formGroups.banUser,
    label: 'Set all future votes of this user to have zero weight',
    hidden: true,
  },

  // nullifyVotes: Set all historical votes of this user to 0, and make any future votes have a vote weight of 0
  nullifyVotes: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['admins'],
    control: 'checkbox',
    group: formGroups.banUser,
    label: 'Nullify all past votes'
  },

  // deleteContent: Flag all comments and posts from this user as deleted
  deleteContent: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['admins'],
    control: 'checkbox',
    group: formGroups.banUser,
    label: 'Delete all user content'
  },

  // banned: Whether the user is banned or not. Can be set by moderators and admins.
  banned: {
    type: Date,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['admins'],
    control: 'datetime',
    label: 'Ban user until',
    group: formGroups.banUser,
  },

  // IPs: All Ips that this user has ever logged in with
  IPs: resolverOnlyField({
    type: Array,
    graphQLtype: '[String!]',
    group: formGroups.banUser,
    canRead: ['sunshineRegiment', 'admins'],
    resolver: async (user: DbUser, args: void, context: ResolverContext): Promise<string[]> => {
      const { currentUser, LWEvents } = context;
      const events: Array<DbLWEvent> = await LWEvents.find(
        {userId: user._id, name: 'login'},
        {
          limit: 10,
          sort: {createdAt: -1}
        }
      ).fetch()
      const filteredEvents = await accessFilterMultiple(currentUser, LWEvents, events, context);
      const IPs = filteredEvents.map(event => event.properties?.ip);
      const uniqueIPs = _.uniq(IPs);
      return uniqueIPs
    },
  }),

  'IPs.$': {
    type: String,
    optional: true,
  },
  auto_subscribe_to_my_posts: {
    label: "Auto-subscribe to comments on my posts",
    group: formGroups.notifications,
    type: Boolean,
    optional: true,
    control: "checkbox",
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    beforeComponent: "ManageSubscriptionsLink",
    ...schemaDefaultValue(true),
  },
  auto_subscribe_to_my_comments: {
    label: "Auto-subscribe to replies to my comments",
    group: formGroups.notifications,
    type: Boolean,
    optional: true,
    control: "checkbox",
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    ...schemaDefaultValue(true),
  },
  autoSubscribeAsOrganizer: {
    label: `Auto-subscribe to posts/events in groups I organize`,
    group: formGroups.notifications,
    type: Boolean,
    optional: true,
    control: "checkbox",
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    hidden: !hasEventsSetting.get(),
    ...schemaDefaultValue(true),
  },

  notificationCommentsOnSubscribedPost: {
    label: `Comments on posts/events I'm subscribed to`,
    ...notificationTypeSettingsField(),
  },
  notificationShortformContent: {
    label: isEAForum
      ? "Quick takes by users I'm subscribed to"
      : "Shortform by users I'm subscribed to",
    ...notificationTypeSettingsField(),
  },
  notificationRepliesToMyComments: {
    label: "Replies to my comments",
    ...notificationTypeSettingsField(),
  },
  notificationRepliesToSubscribedComments: {
    label: "Replies to comments I'm subscribed to",
    ...notificationTypeSettingsField(),
  },
  notificationSubscribedUserPost: {
    label: "Posts by users I'm subscribed to",
    ...notificationTypeSettingsField(),
    onCreate: () => {
      if (!isLWorAF) {
        return {...defaultNotificationTypeSettings, channel: 'both'}
      }
    }
  },
  notificationSubscribedUserComment: {
    label: "Comments by users I'm subscribed to",
    ...notificationTypeSettingsField(),
    hidden: !allowSubscribeToUserComments
  },
  notificationPostsInGroups: {
    label: "Posts/events in groups I'm subscribed to",
    hidden: !hasEventsSetting.get(),
    ...notificationTypeSettingsField({ channel: "both" }),
  },
  notificationSubscribedTagPost: {
    label: "Posts added to tags I'm subscribed to",
    ...notificationTypeSettingsField(),
  },
  notificationSubscribedSequencePost: {
    label: "Posts added to sequences I'm subscribed to",
    ...notificationTypeSettingsField({ channel: "both" }),
    hidden: !allowSubscribeToSequencePosts
  },
  notificationPrivateMessage: {
    label: "Private messages",
    ...notificationTypeSettingsField({ channel: "both" }),
  },
  notificationSharedWithMe: {
    label: "Draft shared with me",
    ...notificationTypeSettingsField({ channel: "both" }),
  },
  notificationAlignmentSubmissionApproved: {
    label: "Alignment Forum submission approvals",
    hidden: !isLWorAF,
    ...notificationTypeSettingsField({ channel: "both"})
  },
  notificationEventInRadius: {
    label: "New events in my notification radius",
    hidden: !hasEventsSetting.get(),
    ...notificationTypeSettingsField({ channel: "both" }),
  },
  notificationKarmaPowersGained: {
    label: "Karma powers gained",
    hidden: true,
    ...notificationTypeSettingsField({ channel: "onsite" }),
  },
  notificationRSVPs: {
    label: "New RSVP responses to my events",
    hidden: !hasEventsSetting.get(),
    ...notificationTypeSettingsField({ channel: "both" }),
  },
  notificationGroupAdministration: {
    label: "Group administration notifications",
    hidden: !hasEventsSetting.get(),
    ...notificationTypeSettingsField({ channel: "both" }),
  },
  notificationCommentsOnDraft: {
    label: "Comments on unpublished draft posts I've shared",
    ...notificationTypeSettingsField({ channel: "both" }),
  },
  notificationPostsNominatedReview: {
    label: `Nominations of my posts for the ${REVIEW_NAME_IN_SITU}`,
    // Hide this while review is inactive
    hidden: true,
    ...notificationTypeSettingsField({ channel: "both" }),
  },
  notificationSubforumUnread: {
    label: `New discussions in topics I'm subscribed to`,
    ...notificationTypeSettingsField({ channel: "onsite", batchingFrequency: "daily" }),
  },
  notificationNewMention: {
    label: "Someone has mentioned me in a post or a comment",
    ...notificationTypeSettingsField(),
  },
  notificationDialogueMessages: {
    label: "New dialogue content in a dialogue I'm participating in",
    ...notificationTypeSettingsField({ channel: "both"}),
    hidden: !dialoguesEnabled,
  },
  notificationPublishedDialogueMessages: {
    label: "New dialogue content in a dialogue I'm subscribed to",
    ...notificationTypeSettingsField(),
    hidden: !dialoguesEnabled,
  },
  notificationAddedAsCoauthor: {
    label: "Someone has added me as a coauthor to a post",
    ...notificationTypeSettingsField({ channel: "both" }),
  },
  //TODO: clean up old dialogue implementation notifications
  notificationDebateCommentsOnSubscribedPost: {
    label: "[Old Style] New dialogue content in a dialogue I'm subscribed to",
    ...notificationTypeSettingsField({ batchingFrequency: 'daily' }),
    hidden: !isLW,
  },
  notificationDebateReplies: {
    label: "[Old Style] New dialogue content in a dialogue I'm participating in",
    ...notificationTypeSettingsField(),
    hidden: !isLW,
  },
  notificationDialogueMatch: {
    label: "Another user and I have matched for a dialogue",
    ...notificationTypeSettingsField({ channel: "both" }),
    hidden: !isLW,
  },
  notificationNewDialogueChecks: {
    label: "You have new people interested in dialogue-ing with you",
    ...notificationTypeSettingsField({ channel: "none" }),
    hidden: !isLW,
  },
  notificationYourTurnMatchForm: {
    label: "Fill in the topics form for your dialogue match",
    ...notificationTypeSettingsField(),
    hidden: !isLW,
  },
  hideDialogueFacilitation: {
    type: Boolean,
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    optional: true,
    nullable: false,
    group: formGroups.siteCustomizations,
    hidden: !isLW,
    label: "Hide the widget for opting in to being approached about dialogues",
    ...schemaDefaultValue(false)
  },

  revealChecksToAdmins: {
    type: Boolean,
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    optional: true,
    nullable: false,
    group: formGroups.siteCustomizations,
    hidden: !isLW,
    label: "Allow users to reveal their checks for better facilitation",
    ...schemaDefaultValue(false)
  },

  optedInToDialogueFacilitation: {
    type: Boolean,
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    optional: true,
    nullable: false,
    group: formGroups.siteCustomizations,
    hidden: !isLW,
    label: "Opted-in to receiving invitations for dialogue facilitation from LessWrong team",
    ...schemaDefaultValue(false)
  },
  showDialoguesList: {
    type: Boolean,
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    optional: false,
    nullable: false,
    group: formGroups.siteCustomizations,
    hidden: !isLW,
    label: "Show a list of recently active dialogues inside the frontpage widget",
    ...schemaDefaultValue(true)
  },
  showMyDialogues: {
    type: Boolean,
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    optional: false,
    nullable: false,
    group: formGroups.siteCustomizations,
    hidden: !isLW,
    label: "Show a list of dialogues the user participated in inside the frontpage widget",
    ...schemaDefaultValue(true)
  },
  showMatches: {
    type: Boolean,
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    optional: false,
    nullable: false,
    group: formGroups.siteCustomizations,
    hidden: !isLW,
    label: "Show a list of dialogue reciprocity matched users inside frontpage widget",
    ...schemaDefaultValue(true)
  },
  showRecommendedPartners: {
    type: Boolean,
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    optional: false,
    nullable: false,
    group: formGroups.siteCustomizations,
    hidden: !isLW,
    label: "Show a list of recommended dialogue partners inside frontpage widget",
    ...schemaDefaultValue(true)
  },
  hideActiveDialogueUsers: {
    type: Boolean,
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    optional: true,
    group: formGroups.siteCustomizations,
    hidden: !isLW,
    label: "Hides/collapses the active dialogue users in the header",
    ...schemaDefaultValue(false)
  },

  // Karma-change notifier settings
  karmaChangeNotifierSettings: {
    group: formGroups.notifications,
    type: karmaChangeSettingsType, // See KarmaChangeNotifierSettings.tsx
    optional: true,
    control: "KarmaChangeNotifierSettings",
    canRead: [userOwns, 'admins'],
    canUpdate: [userOwns, 'admins'],
    canCreate: ['guests'],
    ...schemaDefaultValue(karmaChangeNotifierDefaultSettings)
  },

  // Time at which the karma-change notification was last opened (clicked)
  karmaChangeLastOpened: {
    hidden: true,
    type: Date,
    optional: true,
    canCreate: ['guests'],
    canUpdate: [userOwns, 'admins'],
    canRead: [userOwns, 'admins'],
    logChanges: false,
  },

  // If, the last time you opened the karma-change notifier, you saw more than
  // just the most recent batch (because there was a batch you hadn't viewed),
  // the start of the date range of that batch.
  karmaChangeBatchStart: {
    hidden: true,
    type: Date,
    optional: true,
    canCreate: ['guests'],
    canUpdate: [userOwns, 'admins'],
    canRead: [userOwns, 'admins'],
    logChanges: false,
  },

  // Email settings
  emailSubscribedToCurated: {
    type: Boolean,
    optional: true,
    group: formGroups.emails,
    control: 'EmailConfirmationRequiredCheckbox',
    label: "Email me new posts in Curated",
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    hidden: !isLW,
    canRead: ['members'],
  },
  subscribedToDigest: {
    type: Boolean,
    optional: true,
    group: formGroups.emails,
    label: "Subscribe to the EA Forum Digest emails",
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    hidden: !isEAForum,
    canRead: ['members'],
    ...schemaDefaultValue(false)
  },
  unsubscribeFromAll: {
    type: Boolean,
    optional: true,
    group: formGroups.emails,
    label: "Do not send me any emails (unsubscribe from all)",
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
  },

  hideSubscribePoke: {
    type: Boolean,
    optional: true,
    hidden: true,
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    ...schemaDefaultValue(false),
  },
  
  hideMeetupsPoke: {
    type: Boolean,
    optional: true,
    hidden: true,
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    ...schemaDefaultValue(false),
  },
  
  // Used by the EA Forum to allow users to hide the right-hand side of the home page
  hideHomeRHS: {
    type: Boolean,
    optional: true,
    hidden: true,
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    ...schemaDefaultValue(false),
  },

  // frontpagePostCount: count of how many posts of yours were posted on the frontpage
  frontpagePostCount: {
    type: Number,
    denormalized: true,
    optional: true,
    onCreate: () => 0,

    ...denormalizedCountOfReferences({
      fieldName: "frontpagePostCount",
      collectionName: "Users",
      foreignCollectionName: "Posts",
      foreignTypeName: "post",
      foreignFieldName: "userId",
      filterFn: post => !!post.frontpageDate
    }),
    canRead: ['guests'],
  },

  // sequenceCount: count of how many non-draft, non-deleted sequences you have
  sequenceCount: {
    ...denormalizedCountOfReferences({
      fieldName: "sequenceCount",
      collectionName: "Users",
      foreignCollectionName: "Sequences",
      foreignTypeName: "sequence",
      foreignFieldName: "userId",
      filterFn: sequence => !sequence.draft && !sequence.isDeleted && !sequence.hideFromAuthorPage
    }),
    canRead: ['guests'],
  },

  // sequenceDraftCount: count of how many draft, non-deleted sequences you have
  sequenceDraftCount: {
    ...denormalizedCountOfReferences({
      fieldName: "sequenceDraftCount",
      collectionName: "Users",
      foreignCollectionName: "Sequences",
      foreignTypeName: "sequence",
      foreignFieldName: "userId",
      filterFn: sequence => sequence.draft && !sequence.isDeleted
    }),
    canRead: ['guests'],
  },

  // Should match googleLocation/location
  // Determines which events are considered nearby for default sorting on the community page
  // Determines where the community map is centered/zoomed in on by default
  // Not shown to other users
  mongoLocation: {
    type: Object,
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    blackbox: true,
    optional: true,
    ...denormalizedField({
      needsUpdate: data => ('googleLocation' in data),
      getValue: async (user) => {
        if (user.googleLocation) return googleLocationToMongoLocation(user.googleLocation)
        return null
      }
    }),
  },

  // Is the canonical value for denormalized mongoLocation and location
  // Edited from the /events page to choose where to show events near
  googleLocation: {
    type: Object,
    form: {
      stringVersionFieldName: "location",
    },
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    group: formGroups.siteCustomizations,
    hidden: !hasEventsSetting.get(),
    label: "Account location (used for location-based recommendations)",
    control: 'LocationFormComponent',
    blackbox: true,
    optional: true,
    order: 100,
  },

  location: {
    type: String,
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    hidden: true,
    optional: true
  },

  // Used to place a map marker pin on the where-are-other-users map.
  // Public.
  mapLocation: {
    type: Object,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    group: isLWorAF ? formGroups.siteCustomizations : formGroups.generalInfo,
    order: isLWorAF ? 101 : 5, // would use isFriendlyUI but that's not available here
    label: isLWorAF ? "Public map location" : "Location",
    control: 'LocationFormComponent',
    form: {
      variant: "grey",
    },
    blackbox: true,
    optional: true,
    hidden: isEAForum
  },
  
  mapLocationLatLng: resolverOnlyField({
    type: latLng,
    graphQLtype: "LatLng",
    typescriptType: "LatLng",
    canRead: ['guests'],
    resolver: (user: DbUser, _args: void, _context: ResolverContext) => {
      const mapLocation = user.mapLocation;
      if (!mapLocation?.geometry?.location) return null;

      const { lat, lng } = mapLocation.geometry.location;
      if (typeof lat !== 'number' || typeof lng !== 'number') return null;
      
      return { lat, lng };
    }
  }),

  mapLocationSet: {
    type: Boolean,
    canRead: ['guests'],
    ...denormalizedField({
      needsUpdate: data => ('mapLocation' in data),
      getValue: async (user) => {
        return !!user.mapLocation
      }
    }),
  },

  mapMarkerText: {
    type: String,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    hidden: true,
    label: "Your text on the community map",
    control: "MuiTextField",
    optional: true,
    order: 44
  },

  htmlMapMarkerText: {
    type: String,
    canRead: ['guests'],
    optional: true,
    denormalized: true
  },

  nearbyEventsNotifications: {
    type: Boolean,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    hidden: true,
    optional: true,
    ...schemaDefaultValue(false),
  },

  // Should probably be merged with the other location field.
  nearbyEventsNotificationsLocation: {
    type: Object,
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    hidden: true,
    control: 'LocationFormComponent',
    blackbox: true,
    optional: true,
  },

  nearbyEventsNotificationsMongoLocation: {
    type: Object,
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    blackbox: true,
    optional: true,
    ...denormalizedField({
      needsUpdate: data => ('nearbyEventsNotificationsLocation' in data),
      getValue: async (user) => {
        if (user.nearbyEventsNotificationsLocation) return googleLocationToMongoLocation(user.nearbyEventsNotificationsLocation)
      }
    }),
  },

  nearbyEventsNotificationsRadius: {
    type: Number,
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    hidden: true,
    optional: true,
    min: 0,
    max: MAX_NOTIFICATION_RADIUS
  },

  nearbyPeopleNotificationThreshold: {
    type: Number,
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    hidden: true,
    optional: true
  },

  hideFrontpageMap: {
    type: Boolean,
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    optional: true,
    order: 44,
    group: formGroups.siteCustomizations,
    hidden: !isLW,
    label: "Hide the frontpage map"
  },

  hideTaggingProgressBar: {
    type: Boolean,
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    optional: true,
    hidden: true,
    label: "Hide the tagging progress bar",
    order: 45,
    group: formGroups.siteCustomizations
  },

  hideFrontpageBookAd: {
    // this was for the 2018 book, no longer relevant
    type: Boolean,
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    // canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    optional: true,
    order: 46,
    hidden: true,
    group: formGroups.siteCustomizations,
    label: "Hide the frontpage book ad"
  },

  hideFrontpageBook2019Ad: {
    type: Boolean,
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    optional: true,
    order: 47,
    hidden: true,
    group: formGroups.siteCustomizations,
    label: "Hide the frontpage book ad"
  },

  hideFrontpageBook2020Ad: {
    type: Boolean,
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    optional: true,
    hidden: !isLWorAF,
    order: 47,
    group: formGroups.siteCustomizations,
    label: "Hide the frontpage book ad"
  },

  sunshineNotes: {
    type: String,
    canRead: ['admins', 'sunshineRegiment'],
    canUpdate: ['admins', 'sunshineRegiment'],
    group: formGroups.adminOptions,
    optional: true,
    ...schemaDefaultValue(""),
  },

  sunshineFlagged: {
    type: Boolean,
    canRead: ['admins', 'sunshineRegiment'],
    canUpdate: ['admins', 'sunshineRegiment'],
    group: formGroups.adminOptions,
    optional: true,
    ...schemaDefaultValue(false),
  },

  needsReview: {
    type: Boolean,
    canRead: ['admins', 'sunshineRegiment'],
    canUpdate: ['admins', 'sunshineRegiment'],
    group: formGroups.adminOptions,
    optional: true,
    ...schemaDefaultValue(false),
  },
  // DEPRECATED in favor of snoozedUntilContentCount
  sunshineSnoozed: {
    type: Boolean,
    canRead: ['admins', 'sunshineRegiment'],
    canUpdate: ['admins', 'sunshineRegiment'],
    group: formGroups.adminOptions,
    optional: true,
    ...schemaDefaultValue(false),
  },
  snoozedUntilContentCount: {
    type: Number,
    canRead: ['admins', 'sunshineRegiment'],
    canUpdate: ['admins', 'sunshineRegiment'],
    group: formGroups.adminOptions,
    optional: true
  },

  // Set after a moderator has approved or purged a new user. NB: reviewed does
  // not imply approval, the user might have been banned
  reviewedByUserId: {
    ...foreignKeyField({
      idFieldName: "reviewedByUserId",
      resolverName: "reviewedByUser",
      collectionName: "Users",
      type: "User",
      nullable: true,
    }),
    optional: true,
    canRead: ['sunshineRegiment', 'admins', 'guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    group: formGroups.adminOptions,
  },

  isReviewed: resolverOnlyField({
    type: Boolean,
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    resolver: (user, args, context: ResolverContext) => !!user.reviewedByUserId,
  }),

  reviewedAt: {
    type: Date,
    canRead: ['admins', 'sunshineRegiment'],
    canUpdate: ['admins', 'sunshineRegiment'],
    group: formGroups.adminOptions,
    optional: true
  },

  // A number from 0 to 1, where 0 is almost certainly spam, and 1 is almost
  // certainly not-spam. This is the same scale as ReCaptcha, except that it
  // also includes post-signup activity like moderator approval, upvotes, etc.
  // Scale:
  //   0    Banned and purged user
  //   0-0.8: Unreviewed user, based on ReCaptcha rating on signup (times 0.8)
  //   0.9: Reviewed user
  //   1.0: Reviewed user with 20+ karma
  spamRiskScore: resolverOnlyField({
    type: Number,
    graphQLtype: "Float!",
    canRead: ['guests'],
    resolver: (user: DbUser, args: void, context: ResolverContext) => {
      const isReviewed = !!user.reviewedByUserId;
      const { karma, signUpReCaptchaRating } = user;

      if (user.deleteContent && user.banned) return 0.0;
      else if (userIsAdmin(user)) return 1.0;
      else if (isReviewed && karma >=20) return 1.0;
      else if (isReviewed && karma >=0) return 0.9;
      else if (isReviewed) return 0.8;
      else if (signUpReCaptchaRating !== null && 
              signUpReCaptchaRating !== undefined && 
              signUpReCaptchaRating>=0) {
        // Rescale recaptcha ratings to [0,.8]
        return signUpReCaptchaRating * 0.8;
      } else {
        // No recaptcha rating present; score it .8
        return 0.8;
      }
    }
  }),

  allVotes: resolverOnlyField({
    type: Array,
    graphQLtype: '[Vote]',
    canRead: ['admins', 'sunshineRegiment'],
    resolver: async (document, args, context: ResolverContext) => {
      const { Votes, currentUser } = context;
      const votes = await Votes.find({
        userId: document._id,
        cancelled: false,
      }).fetch();
      if (!votes.length) return [];
      return await accessFilterMultiple(currentUser, Votes, votes, context);
    },
  }),

  'allVotes.$': {
    type: Object,
    optional: true
  },

  afKarma: {
    type: Number,
    optional: true,
    nullable: false,
    label: "Alignment Base Score",
    ...schemaDefaultValue(0),
    canRead: ['guests'],
  },

  // see votingCallbacks.ts for more info
  voteCount: {
    type: Number,
    denormalized: true,
    optional: true,
    label: "Small Upvote Count",
    canRead: ['admins', 'sunshineRegiment'],
  },
  smallUpvoteCount: {
    type: Number,
    denormalized: true,
    optional: true,
    canRead: ['admins', 'sunshineRegiment'],
  },
  smallDownvoteCount: {
    type: Number,
    denormalized: true,
    optional: true,
    canRead: ['admins', 'sunshineRegiment'],
  },
  bigUpvoteCount: {
    type: Number,
    denormalized: true,
    optional: true,
    canRead: ['admins', 'sunshineRegiment'],
  },
  bigDownvoteCount: {
    type: Number,
    denormalized: true,
    optional: true,
    canRead: ['admins', 'sunshineRegiment'],
  },

  // see votingCallbacks.ts and recomputeReceivedVoteCounts.ts for more info
  voteReceivedCount: {
    type: Number,
    denormalized: true,
    optional: true,
    canRead: [userOwns, 'admins', 'sunshineRegiment'],
  },
  smallUpvoteReceivedCount: {
    type: Number,
    denormalized: true,
    optional: true,
    canRead: [userOwns, 'admins', 'sunshineRegiment'],
  },
  smallDownvoteReceivedCount: {
    type: Number,
    denormalized: true,
    optional: true,
    canRead: [userOwns, 'admins', 'sunshineRegiment'],
  },
  bigUpvoteReceivedCount: {
    type: Number,
    denormalized: true,
    optional: true,
    canRead: [userOwns, 'admins', 'sunshineRegiment'],
  },
  bigDownvoteReceivedCount: {
    type: Number,
    denormalized: true,
    optional: true,
    canRead: [userOwns, 'admins', 'sunshineRegiment'],
  },

  usersContactedBeforeReview: {
    type: Array,
    optional: true,
    canRead: ['admins', 'sunshineRegiment'],
  },
  "usersContactedBeforeReview.$": {
    type: String,
  },

  // Full Name field to display full name for alignment forum users
  fullName: {
    type: String,
    optional: true,
    group: formGroups.default,
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment'],
    hidden: !isLWorAF,
    order: 39,
  },

  shortformFeedId: {
    ...foreignKeyField({
      idFieldName: "shortformFeedId",
      resolverName: "shortformFeed",
      collectionName: "Posts",
      type: "Post",
      nullable: true,
    }),
    label: "Quick takes feed ID",
    optional: true,
    canRead: ['guests'],
    canCreate: ['admins', 'sunshineRegiment'],
    canUpdate: ['admins', 'sunshineRegiment'],
    group: formGroups.adminOptions,
  },

  viewUnreviewedComments: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canCreate: ['admins', 'sunshineRegiment'],
    canUpdate: ['admins', 'sunshineRegiment'],
    group: formGroups.adminOptions,
    order: 0,
  },

  partiallyReadSequences: {
    type: Array,
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    canUpdate: [userOwns],
    optional: true,
    hidden: true,
  },
  "partiallyReadSequences.$": {
    type: partiallyReadSequenceItem,
    optional: true,
  },

  beta: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    tooltip: "Get early access to new in-development features",
    group: formGroups.siteCustomizations,
    label: "Opt into experimental (beta) features",
    order: 70,
  },
  reviewVotesQuadratic: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    hidden: true
  },
  reviewVotesQuadratic2019: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    hidden: true
  },
  reviewVoteCount:resolverOnlyField({
    graphQLtype: 'Int!',
    type: Number,
    canRead: ['admins', 'sunshineRegiment'],
    resolver: async (document, args, context: ResolverContext): Promise<number> => {
      const { ReviewVotes } = context;
      const voteCount = await ReviewVotes.find({
        userId: document._id,
        year: REVIEW_YEAR+""
      }).count();
      return voteCount
    }
  }),
  reviewVotesQuadratic2020: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    hidden: true
  },
  petrovPressedButtonDate: {
    type: Date,
    optional: true,
    control: 'datetime',
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    group: formGroups.adminOptions,
    hidden: true
  },
  petrovLaunchCodeDate: {
    type: Date,
    optional: true,
    control: 'datetime',
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    group: formGroups.adminOptions,
    hidden: true
  },
  defaultToCKEditor: {
    // this fieldis deprecated
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['admins'],
    group: formGroups.adminOptions,
    label: "Activate CKEditor by default"
  },
  // ReCaptcha v3 Integration
  // From 0 to 1. Lower is spammier, higher is humaner.
  signUpReCaptchaRating: {
    type: Number,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    tooltip: "Edit this number to '1' if you're confiden they're not a spammer",
    group: formGroups.adminOptions,
  },
  noExpandUnreadCommentsReview: {
    type: Boolean,
    optional: true,
    ...schemaDefaultValue(false),
    hidden: true,
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
  },
  postCount: {
    ...denormalizedCountOfReferences({
      fieldName: "postCount",
      collectionName: "Users",
      foreignCollectionName: "Posts",
      foreignTypeName: "post",
      foreignFieldName: "userId",
      filterFn: (post) => (!post.draft && !post.rejected && post.status===postStatuses.STATUS_APPROVED),
    }),
    canRead: ['guests'],
  },
  maxPostCount: {
    ...denormalizedCountOfReferences({
      fieldName: "maxPostCount",
      collectionName: "Users",
      foreignCollectionName: "Posts",
      foreignTypeName: "post",
      foreignFieldName: "userId"
    }),
    canRead: ['guests'],
    ...schemaDefaultValue(0)
  },
  // The user's associated posts (GraphQL only)
  posts: {
    type: Object,
    optional: true,
    canRead: ['guests'],
    resolveAs: {
      arguments: 'limit: Int = 5',
      type: '[Post]',
      resolver: async (user: DbUser, args: { limit: number }, context: ResolverContext): Promise<Partial<DbPost>[]> => {
        const { limit } = args;
        const { currentUser, Posts } = context;
        const posts = await Posts.find({ userId: user._id }, { limit }).fetch();
        return await accessFilterMultiple(currentUser, Posts, posts, context);
      }
    }
  },

  commentCount: {
    ...denormalizedCountOfReferences({
      fieldName: "commentCount",
      collectionName: "Users",
      foreignCollectionName: "Comments",
      foreignTypeName: "comment",
      foreignFieldName: "userId",
      filterFn: comment => !comment.deleted && !comment.rejected,
      resyncElastic: true,
    }),
    canRead: ['guests'],
  },

  maxCommentCount: {
    ...denormalizedCountOfReferences({
      fieldName: "maxCommentCount",
      collectionName: "Users",
      foreignCollectionName: "Comments",
      foreignTypeName: "comment",
      foreignFieldName: "userId"
    }),
    canRead: ['guests'],
    ...schemaDefaultValue(0)
  },

  tagRevisionCount: {
    ...denormalizedCountOfReferences({
      fieldName: "tagRevisionCount",
      collectionName: "Users",
      foreignCollectionName: "Revisions",
      foreignTypeName: "revision",
      foreignFieldName: "userId",
      filterFn: revision => revision.collectionName === "Tags"
    }),
    canRead: ['guests']
  },

  abTestKey: {
    type: String,
    optional: true,
    nullable: false,
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    canUpdate: ['admins'],
    group: formGroups.adminOptions,
    onCreate: ({ document, context }) => {
      if (!document.abTestKey) {
        return getUserABTestKey({clientId: context.clientId ?? randomId()});
      }
    }
  },
  abTestOverrides: {
    type: GraphQLJSON, //Record<string,number>
    optional: true, hidden: true,
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    blackbox: true,
  },
  // This is deprecated.
  reenableDraftJs: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    tooltip: "Restore the old Draft-JS based editor",
    group: formGroups.siteCustomizations,
    label: "Restore the previous WYSIWYG editor",
    hidden: !isEAForum,
    order: 73,
  },
  walledGardenInvite: {
    type: Boolean,
    optional:true,
    canRead: ['guests'],
    canUpdate: ['admins'],
    group: formGroups.adminOptions,
    hidden: !isLWorAF,
  },
  hideWalledGardenUI: {
    type: Boolean,
    optional:true,
    canRead: ['guests'],
    // canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    group: formGroups.siteCustomizations,
    hidden: !isLWorAF,
  },
  walledGardenPortalOnboarded: {
    type: Boolean,
    optional:true,
    canRead: ['guests'],
    hidden: true,
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
  },
  taggingDashboardCollapsed: {
    type: Boolean,
    optional:true,
    canRead: ['guests'],
    hidden: true,
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
  },
  usernameUnset: {
    type: Boolean,
    optional: true,
    canRead: ['members'],
    hidden: true,
    canUpdate: ['sunshineRegiment', 'admins'],
    ...schemaDefaultValue(false),
  },
  paymentEmail: {
    type: String,
    optional: true,
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    canUpdate: [userOwns, 'admins'],
    label: "Payment Contact Email",
    tooltip: "An email you'll definitely check where you can receive information about receiving payments",
    group: formGroups.paymentInfo,
    hidden: !isLWorAF,
  },
  paymentInfo: {
    type: String,
    optional: true,
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    canUpdate: [userOwns, 'admins'],
    label: "PayPal Info",
    tooltip: "Your PayPal account info, for sending small payments",
    group: formGroups.paymentInfo,
    hidden: !isLWorAF,
  },

  profileUpdatedAt: {
    type: Date,
    optional: false,
    nullable: false,
    canCreate: ["members"],
    canRead: ["guests"],
    canUpdate: [userOwns, "admins"],
    hidden: true,
    onCreate: ({document: user}) => user.createdAt,
    ...schemaDefaultValue(new Date(0)),
  },

  // Cloudinary image id for the profile image (high resolution)
  profileImageId: {
    hidden: true,
    order: isLWorAF ? 40 : 1, // would use isFriendlyUI but that's not available here
    group: formGroups.default,
    type: String,
    optional: true,
    canRead: ['guests'],
    canUpdate: [userOwns, "admins", "sunshineRegiment"],
    label: "Profile Image",
    control: "ImageUpload",
    form: {
      horizontal: true,
    },
  },
  
  jobTitle: {
    type: String,
    hidden: true,
    optional: true,
    canCreate: ['members'],
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    group: formGroups.generalInfo,
    order: 2,
    label: 'Role',
    control: "FormComponentFriendlyTextInput",
  },
  
  organization: {
    type: String,
    hidden: true,
    optional: true,
    canCreate: ['members'],
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    group: formGroups.generalInfo,
    order: 3,
    control: "FormComponentFriendlyTextInput",
  },
  
  careerStage: {
    type: Array,
    hidden: true,
    optional: true,
    canCreate: ['members'],
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    group: formGroups.generalInfo,
    order: 4,
    control: 'FormComponentMultiSelect',
    label: "Career stage",
    placeholder: 'Select all that apply',
    form: {
      variant: "grey",
      separator: ", ",
      options: CAREER_STAGES,
    },
  },
  'careerStage.$': {
    type: String,
    optional: true,
  },

  website: {
    type: String,
    hidden: true,
    optional: true,
    control: 'PrefixedInput',
    canCreate: ['members'],
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    form: {
      inputPrefix: 'https://',
      heading: "Website",
    },
    group: formGroups.socialMedia,
    order: 6
  },

  bio: {
    type: String,
    canRead: ['guests'],
    optional: true,
    hidden: true,
  },
  htmlBio: {
    type: String,
    canRead: ['guests'],
    optional: true,
    hidden: true,
  },

  fmCrosspostUserId: {
    type: String,
    optional: true,
    hidden: true,
    canCreate: ['members'],
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
  },

  linkedinProfileURL: {
    type: String,
    hidden: true,
    optional: true,
    control: 'PrefixedInput',
    canCreate: ['members'],
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    form: {
      inputPrefix: SOCIAL_MEDIA_PROFILE_FIELDS.linkedinProfileURL,
      heading: "Social media",
      smallBottomMargin: true,
    },
    group: formGroups.socialMedia,
    order: 1,
  },
  facebookProfileURL: {
    type: String,
    hidden: true,
    optional: true,
    control: 'PrefixedInput',
    canCreate: ['members'],
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    form: {
      inputPrefix: SOCIAL_MEDIA_PROFILE_FIELDS.facebookProfileURL,
      smallBottomMargin: true,
    },
    group: formGroups.socialMedia,
    order: 2,
  },
  blueskyProfileURL: {
    type: String,
    hidden: true,
    optional: true,
    control: 'PrefixedInput',
    canCreate: ['members'],
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    form: {
      inputPrefix: SOCIAL_MEDIA_PROFILE_FIELDS.blueskyProfileURL,
      smallBottomMargin: true,
    },
    group: formGroups.socialMedia,
    order: 3,
  },
  /**
   * Twitter profile URL that the user can set in their public profile. "URL" is a bit of a misnomer here,
   * if entered correctly this will be *just* the handle (e.g. "eaforumposts" for the account at https://twitter.com/eaforumposts)
   */
  twitterProfileURL: {
    type: String,
    hidden: true,
    optional: true,
    control: 'PrefixedInput',
    canCreate: ['members'],
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    form: {
      inputPrefix: SOCIAL_MEDIA_PROFILE_FIELDS.twitterProfileURL,
      smallBottomMargin: true,
    },
    group: formGroups.socialMedia,
    order: 4,
  },
  /**
   * Twitter profile URL that can only be set by mods/admins. for when a more reliable reference is needed than
   * what the user enters themselves (e.g. for tagging authors from the EA Forum twitter account)
   */
  twitterProfileURLAdmin: {
    type: String,
    optional: true,
    nullable: true,
    hidden: !isEAForum,
    control: 'PrefixedInput',
    canCreate: ['members'],
    canRead: ['sunshineRegiment', 'admins'],
    canUpdate: ['sunshineRegiment', 'admins'],
    form: {
      inputPrefix: SOCIAL_MEDIA_PROFILE_FIELDS.twitterProfileURL,
      heading: "Social media (private, for admin use)",
      smallBottomMargin: false,
    },
    group: formGroups.adminOptions,
    order: 11
  },
  githubProfileURL: {
    type: String,
    hidden: true,
    optional: true,
    control: 'PrefixedInput',
    canCreate: ['members'],
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    form: {
      inputPrefix: SOCIAL_MEDIA_PROFILE_FIELDS.githubProfileURL
    },
    group: formGroups.socialMedia,
    order: 4,
  },

  profileTagIds: {
    ...arrayOfForeignKeysField({
      idFieldName: "profileTagIds",
      resolverName: "profileTags",
      collectionName: "Tags",
      type: "Tag"
    }),
    hidden: true,
    optional: true,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    group: formGroups.aboutMe,
    order: 100,
    control: "TagMultiselect",
    form: {
      variant: "grey",
    },
    label: "Interests",
    placeholder: `Search for ${taggingNamePluralSetting.get()}`
  },
  'profileTagIds.$': {
    type: String,
    foreignKey: "Tags",
    optional: true,
  },
  
  // These are the groups displayed in the user's profile (i.e. this field is informational only).
  // This does NOT affect permissions - use the organizerIds field on localgroups for that.
  organizerOfGroupIds: {
    ...arrayOfForeignKeysField({
      idFieldName: "organizerOfGroupIds",
      resolverName: "organizerOfGroups",
      collectionName: "Localgroups",
      type: "Localgroup"
    }),
    hidden: true,
    optional: true,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    group: formGroups.activity,
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
  'organizerOfGroupIds.$': {
    type: String,
    foreignKey: "Localgroups",
    optional: true,
  },
  
  programParticipation: {
    type: Array,
    hidden: true,
    optional: true,
    canCreate: ['members'],
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    group: formGroups.activity,
    order: 3,
    control: 'FormComponentMultiSelect',
    placeholder: "Which of these programs have you participated in?",
    form: {
      variant: "grey",
      separator: ", ",
      options: PROGRAM_PARTICIPATION
    },
  },
  'programParticipation.$': {
    type: String,
    optional: true,
  },
  
  
  postingDisabled: {
    type: Boolean,
    optional: true,
    canRead: ['members'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    control: 'checkbox',
    group: formGroups.disabledPrivileges,
    order: 69,
  },
  allCommentingDisabled: {
    type: Boolean,
    optional: true,
    canRead: ['members'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    control: 'checkbox',
    group: formGroups.disabledPrivileges,
    order: 70,
  },
  commentingOnOtherUsersDisabled: {
    type: Boolean,
    optional: true,
    canRead: ['members'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    control: 'checkbox',
    group: formGroups.disabledPrivileges,
    order: 71,
  },
  conversationsDisabled: {
    type: Boolean,
    optional: true,
    canRead: ['members'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    control: 'checkbox',
    group: formGroups.disabledPrivileges,
    order: 72,
  },
  
  
  associatedClientId: resolverOnlyField({
    type: "ClientId",
    graphQLtype: "ClientId",
    nullable: true,
    canRead: ['sunshineRegiment', 'admins'],
    resolver: async (user: DbUser, args: void, context: ResolverContext): Promise<DbClientId|null> => {
      return await context.ClientIds.findOne({userIds: user._id}, {
        sort: {createdAt: -1}
      });
    }
  }),
  
  associatedClientIds: resolverOnlyField({
    type: Array,
    graphQLtype: "[ClientId!]",
    nullable: true,
    canRead: ['sunshineRegiment', 'admins'],
    resolver: async (user: DbUser, args: void, context: ResolverContext): Promise<DbClientId[]|null> => {
      return await context.ClientIds.find(
        {userIds: user._id},
        {
          sort: {createdAt: -1},
          limit: 100
        }
      ).fetch();
    }
  }),
  "associatedClientIds.$": {
    type: "ClientId",
  },
  
  altAccountsDetected: resolverOnlyField({
    type: 'Boolean',
    graphQLtype: 'Boolean',
    nullable: true,
    canRead: ['sunshineRegiment', 'admins'],
    resolver: async (user: DbUser, args: void, context: ResolverContext): Promise<boolean> => {
      const clientIds = await context.ClientIds.find(
        {userIds: user._id},
        {
          sort: {createdAt: -1},
          limit: 100
        }
      ).fetch();
      const userIds = new Set<string>();
      for (let clientId of clientIds) {
        for (let userId of clientId.userIds ?? [])
          userIds.add(userId);
      }
      return userIds.size > 1;
    }
  }),
  

  acknowledgedNewUserGuidelines: {
    type: Boolean,
    optional: true,
    nullable: true,
    hidden: true,
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
  },

  moderatorActions: resolverOnlyField({
    type: Array,
    graphQLtype: '[ModeratorAction]',
    canRead: ['sunshineRegiment', 'admins'],
    resolver: async (doc, args, context) => {
      const { ModeratorActions, loaders } = context;
      return ModeratorActions.find({ userId: doc._id }).fetch();
    }
  }),

  'moderatorActions.$': {
    type: 'Object'
  },
  subforumPreferredLayout: {
    type: String,
    allowedValues: Array.from(postsLayouts),
    hidden: true, // only editable by changing the setting from the subforum page
    optional: true,
    canRead: [userOwns, 'admins'],
    canCreate: ['members', 'admins'],
    canUpdate: [userOwns, 'admins'],
  },
  
  // used by the EA Forum to track when a user has dismissed the frontpage job ad
  hideJobAdUntil: {
    type: Date,
    optional: true,
    nullable: true,
    canCreate: ['members'],
    canRead: [userOwns, 'admins'],
    canUpdate: [userOwns, 'admins'],
    hidden: true,
  },
  
  // used by the EA Forum to track if a user has dismissed the post page criticism tips card
  criticismTipsDismissed: {
    type: Boolean,
    canCreate: ['members'],
    canRead: [userOwns, 'admins'],
    canUpdate: [userOwns, 'admins'],
    optional: true,
    hidden: true,
    ...schemaDefaultValue(false),
  },

  /* Privacy settings */
  hideFromPeopleDirectory: {
    type: Boolean,
    optional: true,
    hidden: !isEAForum,
    canRead: ["guests"],
    canUpdate: [userOwns, "sunshineRegiment", "admins"],
    canCreate: ["members"],
    label: "Hide my profile from the People directory",
    group: formGroups.privacy,
    ...schemaDefaultValue(false),
  },

  allowDatadogSessionReplay: {
    type: Boolean,
    optional: true,
    hidden: !isEAForum,
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    label: "Allow Session Replay",
    tooltip: "Allow us to capture a video-like recording of your browser session (using Datadog Session Replay) — this is useful for debugging and improving the site.",
    group: formGroups.privacy,
    ...schemaDefaultValue(false),
  },

  /* Alignment Forum fields */
  afPostCount: {
    ...denormalizedCountOfReferences({
      fieldName: "afPostCount",
      collectionName: "Users",
      foreignCollectionName: "Posts",
      foreignTypeName: "post",
      foreignFieldName: "userId",
      filterFn: (post: DbPost) => (post.af && !post.draft && post.status===postStatuses.STATUS_APPROVED),
    }),
    canRead: ['guests'],
  },

  afCommentCount: {
    type: Number,
    optional: true,
    onCreate: () => 0,
    ...denormalizedCountOfReferences({
      fieldName: "afCommentCount",
      collectionName: "Users",
      foreignCollectionName: "Comments",
      foreignTypeName: "comment",
      foreignFieldName: "userId",
      filterFn: (comment: DbComment) => comment.af,
    }),
    canRead: ['guests'],
  },

  afSequenceCount: {
    ...denormalizedCountOfReferences({
      fieldName: "afSequenceCount",
      collectionName: "Users",
      foreignCollectionName: "Sequences",
      foreignTypeName: "sequence",
      foreignFieldName: "userId",
      filterFn: (sequence: DbSequence) => sequence.af && !sequence.draft && !sequence.isDeleted
    }),
    canRead: ['guests'],
  },

  afSequenceDraftCount: {
    ...denormalizedCountOfReferences({
      fieldName: "afSequenceDraftCount",
      collectionName: "Users",
      foreignCollectionName: "Sequences",
      foreignTypeName: "sequence",
      foreignFieldName: "userId",
      filterFn: (sequence: DbSequence) => sequence.af && sequence.draft && !sequence.isDeleted
    }),
    canRead: ['guests'],
  },

  reviewForAlignmentForumUserId: {
    type: String,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['alignmentForumAdmins', 'admins'],
    canCreate: ['alignmentForumAdmins', 'admins'],
    group: formGroups.adminOptions,
    label: "AF Review UserId",
    hidden: !isLWorAF,
  },

  afApplicationText: {
    type: String,
    optional: true,
    canRead: [userOwns, 'alignmentForumAdmins', 'admins'],
    canUpdate: [userOwns, 'admins'],
    hidden: true,
  },

  afSubmittedApplication: {
    type: Boolean,
    optional: true,
    canRead: [userOwns, 'alignmentForumAdmins', 'admins'],
    canUpdate: [userOwns, 'admins'],
    canCreate: ['admins'],
    hidden: true,
  },
  
  rateLimitNextAbleToComment: {
    type: GraphQLJSON,
    nullable: true,
    canRead: ['guests'],
    hidden: true, optional: true,
  },

  rateLimitNextAbleToPost: {
    type: GraphQLJSON,
    nullable: true,
    canRead: ['guests'],
    hidden: true, optional: true,
  },

  recentKarmaInfo: {
    type: GraphQLJSON,
    nullable: true,
    canRead: ['guests'],
    hidden: true,
    optional: true
  },

  hideSunshineSidebar: {
    type: Boolean,
    optional: true,
    canRead: [userOwns, 'admins'],
    canUpdate: ['admins'],
    canCreate: ['admins'],
    group: formGroups.adminOptions,
    label: "Hide Sunshine Sidebar",
    hidden: isEAForum,
    ...schemaDefaultValue(false),
  },
  
  // EA Forum emails the user a survey if they haven't read a post in 4 months
  inactiveSurveyEmailSentAt: {
    type: Date,
    optional: true,
    nullable: true,
    hidden: true,
    canCreate: ['members'],
    canRead: ['admins'],
    canUpdate: ['admins'],
  },
  // Used by EAF to track when we last emailed the user about the annual user survey
  userSurveyEmailSentAt: {
    type: Date,
    optional: true,
    nullable: true,
    hidden: true,
    canCreate: ['members'],
    canRead: ['admins'],
    canUpdate: ['admins'],
  },
};

export default schema;
