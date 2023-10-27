import SimpleSchema from 'simpl-schema';
import { Utils, slugify, getNestedProperty, throwValidationError } from '../../vulcan-lib';
import {userGetProfileUrl, getAuth0Id, getUserEmail, userOwnsAndInGroup } from "./helpers";
import { userGetEditUrl } from '../../vulcan-users/helpers';
import {
  userGroups,
  userOwns,
  userIsAdmin,
  userIsAdminOrMod,
} from '../../vulcan-users/permissions'
import { formGroups } from './formGroups';
import * as _ from 'underscore';
import { schemaDefaultValue } from '../../collectionUtils';
import { hasEventsSetting, isAF, isEAForum, isLW, isLWorAF, isWakingUp, siteNameWithArticleSetting, taggingNamePluralCapitalSetting, taggingNamePluralSetting, taggingNameSetting } from "../../instanceSettings";
import { accessFilterMultiple, arrayOfForeignKeysField, denormalizedCountOfReferences, denormalizedField, foreignKeyField, googleLocationToMongoLocation, resolverOnlyField } from '../../utils/schemaUtils';
import { postStatuses } from '../posts/constants';
import GraphQLJSON from 'graphql-type-json';
import { REVIEW_NAME_IN_SITU, REVIEW_YEAR } from '../../reviewUtils';
import uniqBy from 'lodash/uniqBy'
import { userThemeSettings, defaultThemeOptions } from "../../../themes/themeNames";
import { postsLayouts } from '../posts/dropdownOptions';
import type { ForumIconName } from '../../../components/common/ForumIcon';
import { getCommentViewOptions } from '../../commentViewOptions';
import { isFriendlyUI } from '../../../themes/forumTheme';
import { hasDigestSetting } from '../../publicSettings';

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

const createDisplayName = (user: DbInsertion<DbUser>): string => {
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
export const karmaChangeNotifierDefaultSettings = {
  // One of the string keys in karmaNotificationTimingChocies
  updateFrequency: "daily",

  // Time of day at which daily/weekly batched updates are released, a number
  // of hours [0,24). Always in GMT, regardless of the user's time zone.
  // Default corresponds to 3am PST.
  timeOfDayGMT: 11,

  // A string day-of-the-week name, spelled out and capitalized like "Monday".
  // Always in GMT, regardless of the user's timezone (timezone matters for day
  // of the week because time zones could take it across midnight.)
  dayOfWeekGMT: "Saturday",

  // A boolean that determines whether we hide or show negative karma updates.
  // False by default because people tend to drastically overweigh negative feedback
  showNegativeKarma: false,
};

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

export interface KarmaChangeSettingsType {
  updateFrequency: "disabled"|"daily"|"weekly"|"realtime"
  timeOfDayGMT: number
  dayOfWeekGMT: "Monday"|"Tuesday"|"Wednesday"|"Thursday"|"Friday"|"Saturday"|"Sunday"
  showNegativeKarma: boolean
}
const karmaChangeSettingsType = new SimpleSchema({
  updateFrequency: {
    type: String,
    optional: true,
    allowedValues: ['disabled', 'daily', 'weekly', 'realtime']
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
  popularComments: {type: Boolean, optional: true, nullable: true},
});

const notificationTypeSettingsField = (overrideSettings?: Partial<NotificationTypeSettings>) => ({
  type: notificationTypeSettings,
  optional: true,
  group: formGroups.notifications,
  control: "NotificationTypeSettings" as const,
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

type CareerStage = {
  value: string,
  label: string,
  icon: ForumIconName,
}

export const CAREER_STAGES: CareerStage[] = [
  {value: 'highSchool', label: "In high school", icon: "School"},
  {value: 'associateDegree', label: "Pursuing an associate's degree", icon: "School"},
  {value: 'undergradDegree', label: "Pursuing an undergraduate degree", icon: "School"},
  {value: 'professionalDegree', label: "Pursuing a professional degree", icon: "School"},
  {value: 'graduateDegree', label: "Pursuing a graduate degree (e.g. Master's)", icon: "School"},
  {value: 'doctoralDegree', label: "Pursuing a doctoral degree (e.g. PhD)", icon: "School"},
  {value: 'otherDegree', label: "Pursuing other degree/diploma", icon: "School"},
  {value: 'earlyCareer', label: "Working (0-5 years)", icon: "Work"},
  {value: 'midCareer', label: "Working (6-15 years)", icon: "Work"},
  {value: 'lateCareer', label: "Working (15+ years)", icon: "Work"},
  {value: 'seekingWork', label: "Seeking work", icon: "Work"},
  {value: 'retired', label: "Retired", icon: "Work"},
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

export const SOCIAL_MEDIA_PROFILE_FIELDS = {
  linkedinProfileURL: 'linkedin.com/in/',
  facebookProfileURL: 'facebook.com/',
  twitterProfileURL: 'twitter.com/',
  githubProfileURL: 'github.com/'
}
export type SocialMediaProfileField = keyof typeof SOCIAL_MEDIA_PROFILE_FIELDS;

export type RateLimitReason = "moderator"|"lowKarma"|"downvoteRatio"|"universal"

/**
 * @summary Users schema
 * @type {Object}
 */
const schema: SchemaType<DbUser> = {
  username: {
    type: String,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['members'],
    hidden: true,
    onInsert: user => {
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
    input: 'checkbox',
    optional: true,
    canCreate: ['admins'],
    canUpdate: ['admins','realAdmins'],
    canRead: ['guests'],
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
  hasAuth0Id: resolverOnlyField({
    type: Boolean,
    // Mods cannot read because they cannot read services, which is a prerequisite
    canRead: [userOwns, 'admins'],
    resolver: (user: DbUser) => {
      try {
        getAuth0Id(user);
        return true;
      } catch {
        return false;
      }
    },
  }),
  // The name displayed throughout the app. Can contain spaces and special characters, doesn't need to be unique
  // Hide the option to change your displayName (for now) TODO: Create proper process for changing name
  displayName: {
    type: String,
    optional: true,
    input: 'text',
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    canRead: ['guests'],
    order: 10,
    onCreate: ({ document: user }) => {
      return user.displayName || createDisplayName(user);
    },
    group: formGroups.default,
  },
  /**
   Used for tracking changes of displayName
   */
  previousDisplayName: {
    type: String,
    optional: true,
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    canRead: ['guests'],
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
    input: 'text',
    canCreate: ['members'],
    canUpdate: ['sunshineRegiment', 'admins'],
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
        throwValidationError({
          typeName: "User",
          field: "email",
          errorType: "errors.required",
          alias: "valid email address",
          capitalizeName: true,
        });
      }
      return data.email;
    },
    form: {
      // Will always be disabled for mods, because they cannot read hasAuth0Id
      disabled: ({document}: AnyBecauseTodo) => isEAForum && !document.hasAuth0Id,
    },
    // unique: true // note: find a way to fix duplicate accounts before enabling this
  },
  // The user's profile URL slug // TODO: change this when displayName changes
  // Unique user slug for URLs, copied over from Vulcan-Accounts
  slug: {
    type: String,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['admins'],
    order: 40,
    group: formGroups.adminOptions,
    
    onCreate: async ({ document: user }) => {
      // create a basic slug from display name and then modify it if this slugs already exists;
      const displayName = createDisplayName(user);
      const basicSlug = slugify(displayName);
      return await Utils.getUnusedSlugByCollectionName('Users', basicSlug);
    },
    onUpdate: async ({data, oldDocument}) => {
      if (data.slug && data.slug !== oldDocument.slug) {
        const slugLower = data.slug.toLowerCase();
        const slugIsUsed = !oldDocument.oldSlugs?.includes(slugLower) && await Utils.slugIsUsed("Users", slugLower)
        if (slugIsUsed) {
          throw Error(`Specified slug is already used: ${slugLower}`)
        }
        return slugLower;
      }
      if (data.displayName && data.displayName !== oldDocument.displayName) {
        const slugForNewName = slugify(data.displayName);
        if (oldDocument.oldSlugs?.includes(slugForNewName) || !await Utils.slugIsUsed("Users", slugForNewName)) {
          return slugForNewName;
        }
      }
    }
  },
  
  noindex: {
    type: Boolean,
    optional: true,
    defaultValue: false,
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
          _.keys(userGroups),
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
    canCreate: userIsAdminOrMod,
    canUpdate: userIsAdminOrMod,
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
    canRead: [userOwns],
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
    // EA Forum does not care about email verification
    canUpdate: isEAForum ?
      [userOwns, 'sunshineRegiment', 'admins'] :
      [],
    canCreate: ['members'],
  },

  // Legacy: Boolean used to indicate that post was imported from old LW database
  legacy: {
    type: Boolean,
    optional: true,
    defaultValue: false,
    hidden: true,
    canRead: [userOwns, 'admins'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
  },

  commentSorting: {
    type: String,
    optional: true,
    canRead: ['guests'],
    canCreate: userIsAdminOrMod,
    canUpdate: userIsAdminOrMod,
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
    canUpdate: userIsAdminOrMod,
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
    canUpdate: userIsAdminOrMod,
    label: "React Palette Style",
    group: formGroups.siteCustomizations,
    allowedValues: ['listView', 'gridView'],
    ...schemaDefaultValue('listView'),
    defaultValue: "listView",
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
    canUpdate: userIsAdminOrMod,
    canCreate: userIsAdminOrMod,
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
    hidden: true,
    optional: true,
    defaultValue: false,
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
    hidden: true,
    optional: true,
    defaultValue: false,
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    control: 'checkbox',
    group: formGroups.siteCustomizations,
    label: "Activate Markdown Editor"
  },

  hideElicitPredictions: {
    order: 80,
    type: Boolean,
    hidden: true,
    optional: true,
    defaultValue: false,
    canRead: [userOwns],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    control: 'checkbox',
    group: formGroups.siteCustomizations,
    label: "Hide other users' Elicit predictions until I have predicted myself",
  },
  
  hideAFNonMemberInitialWarning: {
    order: 90,
    type: Boolean,
    optional: true,
    defaultValue: false,
    canRead: [userOwns],
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
    group: formGroups.siteCustomizations,
    defaultValue: false,
    canRead: ['guests'],
    canUpdate: userIsAdminOrMod,
    canCreate: userIsAdminOrMod,
    control: 'checkbox',
    label: "Do not collapse comments to Single Line"
  },

  noCollapseCommentsPosts: {
    order: 92,
    type: Boolean,
    optional: true,
    group: formGroups.siteCustomizations,
    defaultValue: false,
    canRead: ['guests'],
    canUpdate: userIsAdminOrMod,
    canCreate: userIsAdminOrMod,
    control: 'checkbox',
    label: "Do not truncate comments (in large threads on Post Pages)"
  },

  noCollapseCommentsFrontpage: {
    order: 93,
    type: Boolean,
    optional: true,
    group: formGroups.siteCustomizations,
    defaultValue: false,
    canRead: ['guests'],
    canUpdate: userIsAdminOrMod,
    canCreate: userIsAdminOrMod,
    control: 'checkbox',
    label: "Do not truncate comments (on home page)"
  },

  hideCommunitySection: {
    order: 93,
    type: Boolean,
    optional: true,
    hidden: !isEAForum,
    group: formGroups.siteCustomizations,
    defaultValue: false,
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
    hidden: !isEAForum,
    group: formGroups.siteCustomizations,
    defaultValue: false,
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
    hidden: !isEAForum,
    group: formGroups.siteCustomizations,
    defaultValue: false,
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
    nullable: true,
    group: formGroups.siteCustomizations,
    defaultValue: false,
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

  acceptedTos: {
    type: Boolean,
    optional: true,
    nullable: true,
    hidden: true,
    defaultValue: false,
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
  },

  goodHeartTokens: {
    type: Number,
    optional: true,
    canRead: ['guests'],
  },

  moderationStyle: {
    type: String,
    optional: true,
    hidden: true,
    control: "select",
    group: formGroups.moderationGroup,
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
    hidden: true,
    group: formGroups.moderationGroup,
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
    hidden: true,
    group: formGroups.moderationGroup,
    label: "On my posts, collapse my moderation guidelines by default",
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
    control: 'UsersListEditor'
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
    control: 'UsersListEditor',
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
    onUpdate: ({data, currentUser, oldDocument}) => {
      if (data?.bookmarkedPostsMetadata) {
        return _.uniq(data?.bookmarkedPostsMetadata, 'postId')
      }
    },
    ...arrayOfForeignKeysField({
      idFieldName: "bookmarkedPostsMetadata",
      resolverName: "bookmarkedPosts",
      collectionName: "Posts",
      type: "Post",
      getKey: (obj) => obj.postId
    }),
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
    onUpdate: ({data, currentUser, oldDocument}) => {
      if (data?.hiddenPostsMetadata) {
        return uniqBy(data?.hiddenPostsMetadata, 'postId')
      }
    },
    ...arrayOfForeignKeysField({
      idFieldName: "hiddenPostsMetadata",
      resolverName: "hiddenPosts",
      collectionName: "Posts",
      type: "Post",
      getKey: (obj) => obj.postId
    }),
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
    defaultValue: false,
    canRead: ['guests'],
    canUpdate: ['members', 'admins'],
    label: 'Deactivate',
    tooltip: "Your posts and comments will be listed as '[Anonymous]', and your user profile won't accessible.",
    control: 'checkbox',
    group: formGroups.deactivate,
  },

  // voteBanned: All future votes of this user have weight 0
  voteBanned: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['admins'],
    control: 'checkbox',
    group: formGroups.banUser,
    label: 'Set all future votes of this user to have zero weight'
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
    graphQLtype: '[String]',
    group: formGroups.banUser,
    canRead: ['sunshineRegiment', 'admins'],
    resolver: async (user: DbUser, args: void, context: ResolverContext) => {
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
    hidden: true, //!hasEventsSetting.get(),
    ...schemaDefaultValue(true),
  },

  notificationCommentsOnSubscribedPost: {
    label: `Comments on posts/events I'm subscribed to`,
    ...notificationTypeSettingsField(),
    hidden: true, //!hasEventsSetting.get(),
  },
  notificationShortformContent: {
    label: isEAForum
      ? "Quick takes by users I'm subscribed to"
      : "Shortform by users I'm subscribed to",
    ...notificationTypeSettingsField(),
    hidden: true,
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
  },
  notificationPostsInGroups: {
    label: "Posts/events in groups I'm subscribed to",
    hidden: true, //!hasEventsSetting.get(),
    ...notificationTypeSettingsField({ channel: "both" }),
  },
  notificationSubscribedTagPost: {
    label: "Posts added to tags I'm subscribed to",
    ...notificationTypeSettingsField(),
    hidden: true, // re-enable when tags/topics are re-enabled after launch
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
    hidden: true, //!hasEventsSetting.get(),
    ...notificationTypeSettingsField({ channel: "both" }),
  },
  notificationRSVPs: {
    label: "New RSVP responses to my events",
    hidden: true, //!hasEventsSetting.get(),
    ...notificationTypeSettingsField({ channel: "both" }),
  },
  notificationGroupAdministration: {
    label: "Group administration notifications",
    hidden: true, //!hasEventsSetting.get(),
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
  notificationDebateCommentsOnSubscribedPost: {
    label: "New dialogue content in a dialogue I'm subscribed to",
    ...notificationTypeSettingsField({ batchingFrequency: 'daily' })
  },
  notificationDebateReplies: {
    label: "New dialogue content in a dialogue I'm participating in",
    ...notificationTypeSettingsField()
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
  // Not reusing curated, because we might actually use that as well
  subscribedToDigest: {
    type: Boolean,
    optional: true,
    group: formGroups.emails,
    label: `Subscribe to ${siteNameWithArticleSetting.get()} Digest emails`,
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    hidden: () => !hasDigestSetting.get(),
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
    onInsert: (document, currentUser) => 0,


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
    hidden: true, //!hasEventsSetting.get(),
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
    group: formGroups.default,
    order: 20,
    label: "City",
    control: 'LocationFormComponent',
    form: {
      locationTypes: ["(cities)"]
    },
    blackbox: true,
    optional: true,
  },

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
    canRead: [userOwns],
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
    hidden: true,
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    optional: true,
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
    graphQLtype: "Float",
    canRead: ['guests'],
    resolver: (user: DbUser, args: void, context: ResolverContext) => {
      const isReviewed = !!user.reviewedByUserId;
      const { karma, signUpReCaptchaRating } = user;

      if (user.deleteContent && user.banned) return 0.0;
      else if (userIsAdmin(user)) return 1.0;
      else if (isReviewed && karma>=20) return 1.0;
      else if (isReviewed && karma>=0) return 0.9;
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
    label: "Alignment Base Score",
    defaultValue: 0,
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
    label: isFriendlyUI ? "Quick takes feed ID" : "Shortform feed ID",
    optional: true,
    canRead: ['guests'],
    canCreate: ['admins', 'sunshineRegiment'],
    canUpdate: ['admins', 'sunshineRegiment'],
    group: formGroups.adminOptions,
    hidden: true,
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
    canRead: [userOwns],
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
    canUpdate: ['sunshineRegiment', 'admins'],
    tooltip: "Get early access to new in-development features",
    group: formGroups.siteCustomizations,
    label: "Opt into experimental features",
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
    type: Number,
    canRead: ['admins', 'sunshineRegiment'],
    resolver: async (document, args, context: ResolverContext) => {
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
  oldSlugs: {
    type: Array,
    optional: true,
    canRead: ['guests'],
    onUpdate: async ({data, oldDocument}) => {
      if (data.slug && data.slug !== oldDocument.slug)  {
        // if they are changing back to an old slug, remove it from the array to avoid infinite redirects
        return [...new Set([...(oldDocument.oldSlugs?.filter(s => s !== data.slug) || []), oldDocument.slug])]
      }
      // The next three lines are copy-pasted from slug.onUpdate
      if (data.displayName && data.displayName !== oldDocument.displayName) {
        const slugForNewName = slugify(data.displayName);
        if (oldDocument.oldSlugs?.includes(slugForNewName) || !await Utils.slugIsUsed("Users", slugForNewName)) {
          // if they are changing back to an old slug, remove it from the array to avoid infinite redirects
          return [...new Set([...(oldDocument.oldSlugs?.filter(s => s !== slugForNewName) || []), oldDocument.slug])];
        }
      }
    }
  },
  'oldSlugs.$': {
    type: String,
    optional: true,
    canRead: ['guests'],
  },
  noExpandUnreadCommentsReview: {
    type: Boolean,
    optional: true,
    defaultValue: false,
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
      resolver: async (user: DbUser, args: { limit: number }, context: ResolverContext): Promise<Array<DbPost>> => {
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
      filterFn: comment => !comment.deleted && !comment.rejected
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
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    canUpdate: ['admins'],
    group: formGroups.adminOptions,
  },
  abTestOverrides: {
    type: GraphQLJSON, //Record<string,number>
    optional: true, hidden: true,
    canRead: [userOwns],
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
  },
  paymentInfo: {
    type: String,
    optional: true,
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    canUpdate: [userOwns, 'admins'],
    label: "PayPal Info",
    tooltip: "Your PayPal account info, for sending small payments",
    group: formGroups.paymentInfo,
  },
  
  // Cloudinary image id for the profile image (high resolution)
  profileImageId: {
    hidden: true,
    order: isLWorAF ? 40 : 1, // would use isFriendlyUI but that's not available here
    group: isEAForum ? formGroups.aboutMe : formGroups.default,
    type: String,
    optional: true,
    canRead: ['guests'],
    canUpdate: [userOwns, "admins", "sunshineRegiment"],
    label: "Profile Image",
    control: "ImageUpload"
  },
  
  jobTitle: {
    type: String,
    hidden: true,
    optional: true,
    canCreate: ['members'],
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    group: formGroups.aboutMe,
    order: 2,
    label: 'Role'
  },
  
  organization: {
    type: String,
    hidden: true,
    optional: true,
    canCreate: ['members'],
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    group: formGroups.aboutMe,
    order: 3,
  },
  
  careerStage: {
    type: Array,
    hidden: true,
    optional: true,
    canCreate: ['members'],
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    group: formGroups.aboutMe,
    order: 4,
    control: 'FormComponentMultiSelect',
    label: "Career stage",
    placeholder: 'Select all that apply',
    form: {
      separator: '\r\n',
      options: CAREER_STAGES
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
      inputPrefix: 'https://'
    },
    group: formGroups.aboutMe,
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
      inputPrefix: SOCIAL_MEDIA_PROFILE_FIELDS.linkedinProfileURL
    },
    group: formGroups.socialMedia
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
      inputPrefix: SOCIAL_MEDIA_PROFILE_FIELDS.facebookProfileURL
    },
    group: formGroups.socialMedia
  },
  twitterProfileURL: {
    type: String,
    hidden: true,
    optional: true,
    control: 'PrefixedInput',
    canCreate: ['members'],
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    form: {
      inputPrefix: SOCIAL_MEDIA_PROFILE_FIELDS.twitterProfileURL
    },
    group: formGroups.socialMedia
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
    group: formGroups.socialMedia
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
    group: formGroups.activity,
    order: 1,
    control: "TagMultiselect",
    label: `${taggingNamePluralCapitalSetting.get()} I'm interested in`,
    tooltip: `This will also update your frontpage ${taggingNameSetting.get()} weightings.`,
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
      separator: '\r\n',
      multiselect: true
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
      separator: '\r\n',
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
    type: Boolean,
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

  /* fields for targeting job ads - values currently only changed via /scripts/importEAGUserInterests */

  experiencedIn: {
    type: Array,
    optional: true,
    nullable: true,
    hidden: true,
    canRead: [userOwns, 'admins'],
  },
  'experiencedIn.$': {
    type: String,
    optional: true
  },
  interestedIn: {
    type: Array,
    optional: true,
    nullable: true,
    hidden: true,
    canRead: [userOwns, 'admins'],
  },
  'interestedIn.$': {
    type: String,
    optional: true
  },

  /* Privacy settings */
  allowDatadogSessionReplay: {
    type: Boolean,
    optional: true,
    nullable: true,
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
    label: "AF Review UserId"
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

  wu_uuid: {
    type: String,
    nullable: true,
    canRead: ownsOrIsAdmin,
    hidden: true,
    optional: true
  },

  first_name: {
    type: String,
    nullable: true,
    input: 'text',
    canRead: ['guests'],
    canUpdate: ownsOrIsMod,
    canCreate: ['members'],
    optional: true,
    order: 10,
    group: formGroups.default,
  },

  last_name: {
    type: String,
    nullable: true,
    input: 'text',
    canRead: ['guests'],
    canUpdate: ownsOrIsMod,
    canCreate: ['members'],
    optional: true,
    order: 10,
    group: formGroups.default,
  },

  avatar: {
    type: String,
    nullable: true,
    canRead: 'guests',
    hidden: true,
    optional: true
  },

  wu_created_at: {
    type: Date,
    nullable: true,
    canRead: 'guests',
    hidden: true,
    optional: true
  },

  wu_forum_access: {
    type: Boolean,
    nullable: true,
    canRead: ownsOrIsMod,
    hidden: true,
    optional: true
  },

  wu_has_ever_been_paid_subscriber: {
    type: Boolean,
    nullable: true,
    canRead: ownsOrIsMod,
    hidden: true,
    optional: true
  },

  wu_subscription_expires_at: {
    type: Date,
    nullable: true,
    canRead: ownsOrIsMod,
    hidden: true,
    optional: true
  },

  wu_subscription_active: {
    type: Boolean,
    nullable: true,
    canRead: ownsOrIsMod,
    hidden: true,
    optional: true
  },
};

export default schema;
