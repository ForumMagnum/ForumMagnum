import SimpleSchema from 'simpl-schema';
import * as _ from 'underscore';
import { addUniversalFields, schemaDefaultValue } from '../../collectionUtils';
import { makeEditable } from '../../editor/make_editable';
import { getDefaultFilterSettings } from '../../filterSettings';
import { forumTypeSetting, hasEventsSetting } from "../../instanceSettings";
import { accessFilterMultiple, addFieldsDict, arrayOfForeignKeysField, denormalizedCountOfReferences, denormalizedField, foreignKeyField, googleLocationToMongoLocation, resolverOnlyField } from '../../utils/schemaUtils';
import { postStatuses } from '../posts/constants';
import Users from "./collection";
import { userOwnsAndInGroup } from "./helpers";
import { userOwns, userIsAdmin } from '../../vulcan-users/permissions';
import GraphQLJSON from 'graphql-type-json';
import { formGroups } from './formGroups';
import { REVIEW_YEAR } from '../../reviewUtils';

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

export type NotificationTypeSettings = {
  channel: "none"|"onsite"|"email"|"both",
  batchingFrequency: "realtime"|"daily"|"weekly",
  timeOfDayGMT: number,
  dayOfWeekGMT: "Monday"|"Tuesday"|"Wednesday"|"Thursday"|"Friday"|"Saturday"|"Sunday",
};

export const defaultNotificationTypeSettings: NotificationTypeSettings = {
  channel: "onsite",
  batchingFrequency: "realtime",
  timeOfDayGMT: 12,
  dayOfWeekGMT: "Monday",
};

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

const notificationTypeSettingsField = (overrideSettings?: any) => ({
  type: notificationTypeSettings,
  optional: true,
  group: formGroups.notifications,
  control: "NotificationTypeSettings" as keyof ComponentTypes,
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

addFieldsDict(Users, {
  // TODO(EA): Allow resending of confirmation email
  whenConfirmationEmailSent: {
    type: Date,
    optional: true,
    order: 1,
    group: formGroups.emails,
    control: 'UsersEmailVerification',
    canRead: ['members'],
    // EA Forum does not care about email verification
    canUpdate: forumTypeSetting.get() === 'EAForum' ?
      [] :
      [userOwns, 'sunshineRegiment', 'admins'],
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
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    order: 43,
    group: formGroups.siteCustomizations,
    control: "select",
    form: {
      // TODO - maybe factor out??
      options: function () { // options for the select form control
        let commentViews = [
          {value:'postCommentsTop', label: 'magical algorithm'},
          {value:'postCommentsNew', label: 'most recent'},
          {value:'postCommentsOld', label: 'oldest'},
        ];
        if (forumTypeSetting.get() === 'AlignmentForum') {
          return commentViews.concat([
            {value:'postLWComments', label: 'magical algorithm (include LW)'}
          ])
        }
        return commentViews
      }
    },
  },


  sortDrafts: {
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

  // Intercom: Will the user display the intercom while logged in?
  hideIntercom: {
    order: 70,
    type: Boolean,
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
    order: 71,
    type: Boolean,
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
    hidden: forumTypeSetting.get() !== 'AlignmentForum',
    label: "Hide explanations of how AIAF submissions work for non-members", //TODO: just hide this in prod
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
    ...schemaDefaultValue(getDefaultFilterSettings),
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
  allPostsOpenSettings: {
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
    canRead: userOwns,
    canUpdate: userOwns,
    canCreate: 'guests',
    hidden: true,
    logChanges: false,
  },

  // Bio (Markdown version)
  bio: {
    type: String,
    optional: true,
    control: "MuiTextField",
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canRead: ['guests'],
    group: formGroups.default,
    order: 40,
    form: {
      hintText:"Bio",
      rows:4,
      multiLine:true,
      fullWidth:true,
    },
  },

  // Bio (HTML version)
  htmlBio: {
    type: String,
    denormalized: true,
    optional: true,
    canRead: ['guests'],
  },

  // Karma field
  karma: {
    type: Number,
    optional: true,
    canRead: ['guests'],
  },

  // Website
  website: {
    type: String,
    hidden: true,
    optional: true,
    control: "text",
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canRead: ['guests'],
    order: 50,
  },

  moderationStyle: {
    type: String,
    optional: true,
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
    group: formGroups.moderationGroup,
    label: "On my posts, collapse my moderation guidelines by default",
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members', 'sunshineRegiment', 'admins'],
    control: 'checkbox',
    order: 56,
  },

  showHideKarmaOption: {
    type: Boolean,
    optional: true,
    label: "Enable option on posts to hide karma visibility",
    canRead: [userOwns, 'admins'],
    canUpdate: [userOwnsAndInGroup('trustLevel1'), 'sunshineRegiment', 'admins'],
    canCreate: ['members', 'sunshineRegiment', 'admins'],
    hidden: forumTypeSetting.get() !== 'EAForum',
    control: 'checkbox',
    group: formGroups.default,
    order: 72,
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
    canUpdate: ['admins'],
    label: 'Delete this user',
    control: 'checkbox',
    group: formGroups.adminOptions,
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
    label: "Auto-subscribe to posts and meetups in groups I organize",
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
    label: "Comments on posts I'm subscribed to",
    ...notificationTypeSettingsField(),
  },
  notificationShortformContent: {
    label: "Shortform by users I'm subscribed to",
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
    hidden: forumTypeSetting.get() === 'EAForum',
    ...notificationTypeSettingsField({ channel: "both"})
  },
  notificationEventInRadius: {
    label: "New Events in my notification radius",
    hidden: !hasEventsSetting.get(),
    ...notificationTypeSettingsField({ channel: "both" }),
  },
  notificationRSVPs: {
    label: "New RSVP responses to my events",
    hidden: !hasEventsSetting.get(),
    ...notificationTypeSettingsField({ channel: "both" }),
  },
  notificationCommentsOnDraft: {
    label: "Comments on unpublished draft posts I've shared",
    ...notificationTypeSettingsField({ channel: "both" }),
  },
  notificationPostsNominatedReview: {
    label: "Nominations of my posts for the annual LessWrong Review",
    ...notificationTypeSettingsField({ channel: "both" }),
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
    hidden: ['AlignmentForum', 'EAForum'].includes(forumTypeSetting.get()),
    canRead: ['members'],
  },
  // Not reusing curated, because we might actually use that as well
  subscribedToDigest: {
    type: Boolean,
    optional: true,
    group: formGroups.emails,
    label: "Subscribe to the EA Forum Digest emails",
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    hidden: forumTypeSetting.get() !== 'EAForum',
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
      filterFn: sequence => !sequence.draft && !sequence.isDeleted
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

  mongoLocation: {
    type: Object,
    canRead: ['guests'],
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

  googleLocation: {
    type: Object,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    group: formGroups.default,
    hidden: !hasEventsSetting.get(),
    label: "Group Location",
    control: 'LocationFormComponent',
    blackbox: true,
    optional: true,
    order: 42,
  },

  location: {
    type: String,
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    hidden: true,
    optional: true
  },

  mapLocation: {
    type: Object,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    hidden: true,
    label: "Your location on the community map",
    control: 'LocationFormComponent',
    blackbox: true,
    optional: true,
    order: 43,
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
    group: formGroups.default,
    hidden: true,
    label: "Hide the frontpage map"
  },

  hideTaggingProgressBar: {
    type: Boolean,
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    optional: true,
    hidden: forumTypeSetting.get() === "EAForum",
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
    hidden: forumTypeSetting.get() === "EAForum",
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
    hidden: forumTypeSetting.get() === "EAForum",
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

  sunshineSnoozed: {
    type: Boolean,
    canRead: ['admins', 'sunshineRegiment'],
    canUpdate: ['admins', 'sunshineRegiment'],
    group: formGroups.adminOptions,
    optional: true,
    ...schemaDefaultValue(false),
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
    defaultValue: false,
    canRead: ['guests'],
  },

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

  // Full Name field to display full name for alignment forum users
  fullName: {
    type: String,
    optional: true,
    group: formGroups.default,
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment'],
    hidden: !['LessWrong', 'AlignmentForum'].includes(forumTypeSetting.get()),
    order: 39,
  },

  noSingleLineComments: {
    order: 70,
    type: Boolean,
    optional: true,
    group: formGroups.truncationOptions,
    defaultValue: false,
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    control: 'checkbox',
    label: "Do not collapse comments to Single Line"
  },

  noCollapseCommentsPosts: {
    order: 70,
    type: Boolean,
    optional: true,
    group: formGroups.truncationOptions,
    defaultValue: false,
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    control: 'checkbox',
    label: "Do not truncate comments (in large threads on Post Pages)"
  },

  noCollapseCommentsFrontpage: {
    order: 70,
    type: Boolean,
    optional: true,
    group: formGroups.truncationOptions,
    defaultValue: false,
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    control: 'checkbox',
    label: "Do not truncate comments (on home page)"
  },

  shortformFeedId: {
    ...foreignKeyField({
      idFieldName: "shortformFeedId",
      resolverName: "shortformFeed",
      collectionName: "Posts",
      type: "Post",
      nullable: true,
    }),
    optional: true,
    viewableBy: ['guests'],
    insertableBy: ['admins', 'sunshineRegiment'],
    editableBy: ['admins', 'sunshineRegiment'],
    group: formGroups.adminOptions,
  },

  viewUnreviewedComments: {
    type: Boolean,
    optional: true,
    viewableBy: ['guests'],
    insertableBy: ['admins', 'sunshineRegiment'],
    editableBy: ['admins', 'sunshineRegiment'],
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
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
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
  },
  oldSlugs: {
    type: Array,
    optional: true,
    canRead: ['guests'],
    onUpdate: ({data, oldDocument}) => {
      if (data.slug && data.slug !== oldDocument.slug)  {
        return [...(oldDocument.oldSlugs || []), oldDocument.slug]
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
      filterFn: (post) => (!post.draft && post.status===postStatuses.STATUS_APPROVED),
    }),
    viewableBy: ['guests'],
  },
  maxPostCount: {
    ...denormalizedCountOfReferences({
      fieldName: "maxPostCount",
      collectionName: "Users",
      foreignCollectionName: "Posts",
      foreignTypeName: "post",
      foreignFieldName: "userId"
    }),
    viewableBy: ['guests'],
    ...schemaDefaultValue(0)
  },
  // The user's associated posts (GraphQL only)
  posts: {
    type: Object,
    optional: true,
    viewableBy: ['guests'],
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
      filterFn: comment => !comment.deleted
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
  reenableDraftJs: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    tooltip: "Restore the old Draft-JS based editor",
    group: formGroups.siteCustomizations,
    label: "Restore the previous WYSIWYG editor",
    order: 72,
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
    hidden: forumTypeSetting.get() === "EAForum",
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
});

makeEditable({
  collection: Users,
  options: {
    // Determines whether to use the comment editor configuration (e.g. Toolbars)
    commentEditor: true,
    // Determines whether to use the comment editor styles (e.g. Fonts)
    commentStyles: true,
    formGroup: formGroups.moderationGroup,
    order: 50,
    fieldName: "moderationGuidelines",
    permissions: {
      viewableBy: ['guests'],
      editableBy: [userOwns, 'sunshineRegiment', 'admins'],
      insertableBy: [userOwns, 'sunshineRegiment', 'admins']
    }
  }
})

addUniversalFields({collection: Users})
