import Users from "meteor/vulcan:users";
import { getSetting } from "meteor/vulcan:core"
import { foreignKeyField, addFieldsDict, resolverOnlyField } from '../../modules/utils/schemaUtils'
import { makeEditable } from '../../editor/make_editable.js'
import { addUniversalFields } from '../../collectionUtils'
import SimpleSchema from 'simpl-schema'
import { schemaDefaultValue } from '../../collectionUtils';


export const formGroups = {
  moderationGroup: {
    order:60,
    name: "moderation",
    label: "Moderation & Moderation Guidelines",
  },
  banUser: {
    order:50,
    name: "banUser",
    label: "Ban & Purge User",
    startCollapsed: true,
  },
  notifications: {
    order: 10,
    name: "notifications",
    label: "Notifications"
  },
  emails: {
    order: 15,
    name: "emails",
    label: "Emails"
  },
  adminOptions: {
    name: "adminOptions",
    order: 25,
    label: "Admin Options",
    startCollapsed: true,
  },
}

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
};

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
  }
})

addFieldsDict(Users, {
  createdAt: {
    type: Date,
    onInsert: (user, options) => {
      return user.createdAt || new Date();
    },
    canRead: ["guests"]
  },

  // LESSWRONG: Overwrite Vulcan locale field to be hidden by default
  locale: {
    hidden: true,
    canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
  },

  // Emails (not to be confused with email). This field belongs to Meteor's
  // accounts system; we should never write it, but we do need to read it to find
  // out whether a user's email address is verified.
  emails: {
    hidden: true,
    canRead: [Users.owns, 'sunshineRegiment', 'admins'],
  },
  'emails.$': {
    type: Object,
  },

  whenConfirmationEmailSent: {
    type: Date,
    optional: true,
    order: 1,
    group: formGroups.emails,
    control: 'UsersEmailVerification',
    canRead: ['members'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['members'],
  },

  // Legacy: Boolean used to indicate that post was imported from old LW database
  legacy: {
    type: Boolean,
    optional: true,
    defaultValue: false,
    hidden: true,
    canRead: ['guests'],
    canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
  },

  commentSorting: {
    type: String,
    optional: true,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
    order: 65,
    control: "select",
    form: {
      // TODO – maybe factor out??
      options: function () { // options for the select form control
        let commentViews = [
          {value:'postCommentsTop', label: 'magical algorithm'},
          {value:'postCommentsNew', label: 'most recent'},
          {value:'postCommentsOld', label: 'oldest'},
        ];
        if (getSetting('AlignmentForum', false)) {
          return commentViews.concat([
            {value:'postLWComments', label: 'magical algorithm (include LW)'}
          ])
        }
        return commentViews
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
    canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    control: 'checkbox',
    label: "Hide Intercom"
  },

  // This field-name is no longer accurate, but is here because we used to have that field
  // around and then removed `markDownCommentEditor` and merged it into this field.
  markDownPostEditor: {
    order: 70,
    type: Boolean,
    optional: true,
    defaultValue: false,
    canRead: ['guests'],
    canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    control: 'checkbox',
    label: "Activate Markdown Editor"
  },

  email: {
    order: 20,
    canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
  },
  currentFrontpageFilter: {
    type: String,
    optional: true,
    canRead: Users.owns,
    canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
    canCreate: Users.owns,
    hidden: true,
  },
  allPostsFilter: {
    type: String,
    optional: true,
    canRead: Users.owns,
    canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
    canCreate: Users.owns,
    hidden: true,
  },
  allPostsView: {
    type: String,
    optional: true,
    hidden: true,
    canRead: Users.owns,
    canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
    canCreate: Users.owns,
  },
  allPostsShowLowKarma: {
    type: Boolean,
    optional: true,
    canRead: Users.owns,
    canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
    canCreate: Users.owns,
    hidden: true,
  },
  allPostsOpenSettings: {
    type: Boolean,
    optional: true,
    canRead: Users.owns,
    canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
    canCreate: Users.owns,
    hidden: true,
  },
  lastNotificationsCheck: {
    type: Date,
    optional: true,
    canRead: Users.owns,
    canUpdate: Users.owns,
    canCreate: Users.owns,
    hidden: true,
  },

  // Bio (Markdown version)
  bio: {
    type: String,
    optional: true,
    control: "MuiTextField",
    canCreate: ['members'],
    canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
    canRead: ['guests'],
    order: 40,
    searchable: true,
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
    canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
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
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
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
    label: "I'm happy for LW site moderators to help enforce my policy",
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
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
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['members', 'sunshineRegiment', 'admins'],
    control: 'checkbox',
    order: 56,
  },

  twitterUsername: {
    hidden: true,
    canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
  },

  // bannedUserIds: users who are not allowed to comment on this user's posts
  bannedUserIds: {
    type: Array,
    group: formGroups.moderationGroup,
    canRead: ['guests'],
    canUpdate: [Users.ownsAndInGroup('trustLevel1'), 'sunshineRegiment', 'admins'],
    canCreate: [Users.ownsAndInGroup('trustLevel1'), 'sunshineRegiment', 'admins'],
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
    canUpdate: [Users.ownsAndInGroup('canModeratePersonal'), 'sunshineRegiment', 'admins'],
    canCreate: [Users.ownsAndInGroup('canModeratePersonal'), 'sunshineRegiment', 'admins'],
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
    canCreate: ['members'],
    label: 'Delete this user',
    control: 'checkbox',
    hidden: true,
  },

  // legacyData: A complete dump of all the legacy data we have on this post in a
  // single blackbox object. Never queried on the client, but useful for a lot
  // of backend functionality, and simplifies the data import from the legacy
  // LessWrong database
  legacyData: {
    type: Object,
    optional: true,
    canRead: ['admins'],
    canCreate: ['admins'],
    canUpdate: ['admins'],
    hidden: true,
    blackbox: true,
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
    resolver: (user, args, context) => {
      const events = context.LWEvents.find({userId: user._id, name: 'login'}, {fields: context.Users.getViewableFields(context.currentUser, context.LWEvents), limit: 10, sort: {createdAt: -1}}).fetch()
      const filteredEvents = _.filter(events, e => context.LWEvents.checkAccess(context.currentUser, e))
      const IPs = filteredEvents.map(event => event.properties && event.properties.ip);
      const uniqueIPs = _.uniq(IPs);
      return uniqueIPs
    },
  }),

  'IPs.$': {
    type: String,
    optional: true,
  },

  // New Notifications settings
  auto_subscribe_to_my_posts: {
    group: formGroups.notifications,
    label: "Notifications for Comments on My Posts"
  },
  auto_subscribe_to_my_comments: {
    group: formGroups.notifications,
    label: "Notifications For Replies to My Comments",
  },
  
  // Karma-change notifier settings
  karmaChangeNotifierSettings: {
    group: formGroups.notifications,
    type: karmaChangeSettingsType, // See KarmaChangeNotifierSettings.jsx
    optional: true,
    control: "KarmaChangeNotifierSettings",
    canRead: [Users.owns, 'admins'],
    canUpdate: [Users.owns, 'admins', 'sunshineRegiment'],
    canCreate: [Users.owns, 'admins', 'sunshineRegiment'],
    ...schemaDefaultValue(karmaChangeNotifierDefaultSettings)
  },
  
  // Time at which the karma-change notification was last opened (clicked)
  karmaChangeLastOpened: {
    hidden: true,
    type: Date,
    optional: true,
    canCreate: [Users.owns, 'admins'],
    canUpdate: [Users.owns, 'admins'],
    canRead: [Users.owns, 'admins'],
  },
  
  // If, the last time you opened the karma-change notifier, you saw more than
  // just the most recent batch (because there was a batch you hadn't viewed),
  // the start of the date range of that batch.
  karmaChangeBatchStart: {
    hidden: true,
    type: Date,
    optional: true,
    canCreate: [Users.owns, 'admins'],
    canUpdate: [Users.owns, 'admins'],
    canRead: [Users.owns, 'admins'],
  },

  // Email settings
  emailSubscribedToCurated: {
    type: Boolean,
    optional: true,
    group: formGroups.emails,
    control: 'EmailConfirmationRequiredCheckbox',
    label: "Email me new posts in Curated",
    canCreate: ['members'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canRead: ['members'],
  },

  // Hide the option to change your displayName (for now) TODO: Create proper process for changing name
  displayName: {
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
  },

  // frontpagePostCount: count of how many posts of yours were posted on the frontpage
  frontpagePostCount: {
    type: Number,
    denormalized: true,
    optional: true,
    canRead: ['guests'],
    onInsert: (document, currentUser) => 0,
  },

  // sequenceCount: count of how many non-draft, non-deleted sequences you have
  sequenceCount: {
    type: Number,
    denormalized: true,
    optional: true,
    canRead: ['guests'],
    onInsert: (document, currentUser) => 0,
  },

  // sequenceDraftCount: count of how many draft, non-deleted sequences you have
  sequenceDraftCount: {
    type: Number,
    denormalized: true,
    optional: true,
    canRead: ['guests'],
    onInsert: (document, currentUser) => 0,
  },

  mongoLocation: {
    type: Object,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
    hidden: true,
    blackbox: true,
    optional: true
  },

  googleLocation: {
    type: Object,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['sunshineRegiment', 'admins'],
    label: "Group Location",
    control: 'LocationFormComponent',
    blackbox: true,
    optional: true
  },

  location: {
    type: String,
    searchable: true,
    canRead: ['guests'],
    canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    hidden: true,
    optional: true
  },

  reviewedByUserId: {
    ...foreignKeyField({
      idFieldName: "reviewedByUserId",
      resolverName: "reviewedByUser",
      collectionName: "Users",
      type: "User",
    }),
    optional: true,
    canRead: ['sunshineRegiment', 'admins'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    group: formGroups.adminOptions,
  },

  allVotes: resolverOnlyField({
    type: Array,
    graphQLtype: '[Vote]',
    canRead: ['admins', 'sunshineRegiment'],
    resolver: async (document, args, { Users, Votes, currentUser }) => {
      const votes = await Votes.find({
        userId: document._id,
        cancelled: false,
      }).fetch();
      if (!votes.length) return [];
      return Users.restrictViewableFields(currentUser, Votes, votes);
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
    canRead: ['guests'],
  },

  smallUpvoteCount: {
    type: Number,
    denormalized: true,
    optional: true,
    canRead: ['guests'],
  },

  smallDownvoteCount: {
    type: Number,
    denormalized: true,
    optional: true,
    canRead: ['guests'],
  },

  bigUpvoteCount: {
    type: Number,
    denormalized: true,
    optional: true,
    canRead: ['guests'],
  },

  bigDownvoteCount: {
    type: Number,
    denormalized: true,
    optional: true,
    canRead: ['guests'],
  },

  // Full Name field to display full name for alignment forum users
  fullName: {
    type: String,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment']
  },

  noCollapseCommentsPosts: {
    order: 70,
    type: Boolean,
    optional: true,
    defaultValue: false,
    canRead: ['guests'],
    canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    control: 'checkbox',
    label: "Do not collapse comments (in large threads on Post Pages)"
  },

  noCollapseCommentsFrontpage: {
    order: 70,
    type: Boolean,
    optional: true,
    defaultValue: false,
    canRead: ['guests'],
    canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    control: 'checkbox',
    label: "Do not collapse comments (on home page)"
  },

  shortformFeedId: {
    ...foreignKeyField({
      idFieldName: "shortformFeedId",
      resolverName: "shortformFeed",
      collectionName: "Posts",
      type: "Post"
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
  }
});

export const makeEditableOptionsModeration = {
  // Determines whether to use the comment editor configuration (e.g. Toolbars)
  commentEditor: true,
  // Determines whether to use the comment editor styles (e.g. Fonts)
  commentStyles: true,
  formGroup: formGroups.moderationGroup,
  adminFormGroup: formGroups.adminOptions,
  order: 50,
  fieldName: "moderationGuidelines",
  permissions: {
    viewableBy: ['guests'],
    editableBy: ['sunshineRegiment', 'admins'],
    insertableBy: ['sunshineRegiment', 'admins']
  },
  deactivateNewCallback: true, // Fix to avoid triggering the editable operations on incomplete users during creation
}

makeEditable({
  collection: Users,
  options: makeEditableOptionsModeration
})

addUniversalFields({collection: Users})
