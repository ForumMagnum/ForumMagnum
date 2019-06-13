import Users from "meteor/vulcan:users";
import { getSetting, Utils } from "meteor/vulcan:core"
import { foreignKeyField, addFieldsDict, resolverOnlyField, denormalizedCountOfReferences } from '../../modules/utils/schemaUtils'
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

  // A boolean that determines whether we hide or show negative karma updates.
  // False by default because people tend to drastically overweigh negative feedback
  showNegativeKarma: false,
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
  },
  showNegativeKarma: {
    type: Boolean,
    optional: true,
  }
})

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
    canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    hidden: true,
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
        if (getSetting('forumType') === 'AlignmentForum') {
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
    canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
    canCreate: [Users.owns, 'sunshineRegiment', 'admins'],
    hidden: true,
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
    canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
    canCreate: ['members', 'sunshineRegiment', 'admins'],
    hidden: true,
    control: 'checkbox',
    order: 55,
  },

  collapseModerationGuidelines: {
    type: Boolean,
    optional: true,
    group: formGroups.moderationGroup,
    label: "On my posts, collapse my moderation guidelines by default",
    canRead: ['guests'],
    canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
    canCreate: ['members', 'sunshineRegiment', 'admins'],
    hidden: true,
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
    canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
    hidden: ['AlignmentForum', 'EAForum'].includes(getSetting('forumType')),
    canRead: ['members'],
  },
  unsubscribeFromAll: {
    type: Boolean,
    optional: true,
    group: formGroups.emails,
    label: "Do not send me any emails (unsubscribe from all)",
    canCreate: ['members'],
    canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
    canRead: [Users.owns, 'sunshineRegiment', 'admins'],
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
    canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
    hidden: !getSetting('hasEvents', true),
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

  // Set after a moderator has approved or purged a new user. NB: reviewed does
  // not imply approval, the user might have been banned
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

  isReviewed: resolverOnlyField({
    type: Boolean,
    canRead: [Users.owns, 'sunshineRegiment', 'admins'],
    resolver: (user, args, context) => !!user.reviewedByUserId,
  }),
  
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
    resolver: (user, args, context) => {
      const isReviewed = !!user.reviewedByUserId;
      const { karma, signUpReCaptchaRating } = user;
      
      if (user.deleteContent && user.banned) return 0.0;
      else if (Users.isAdmin(user)) return 1.0;
      else if (isReviewed && karma>=20) return 1.0;
      else if (isReviewed && karma>=0) return 0.9;
      else if (isReviewed) return 0.8;
      else if (signUpReCaptchaRating>=0) {
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
    canRead: ['sunshineRegiment'],
  },

  smallUpvoteCount: {
    type: Number,
    denormalized: true,
    optional: true,
    canRead: ['sunshineRegiment'],
  },

  smallDownvoteCount: {
    type: Number,
    denormalized: true,
    optional: true,
    canRead: ['sunshineRegiment'],
  },

  bigUpvoteCount: {
    type: Number,
    denormalized: true,
    optional: true,
    canRead: ['sunshineRegiment'],
  },

  bigDownvoteCount: {
    type: Number,
    denormalized: true,
    optional: true,
    canRead: ['sunshineRegiment'],
  },

  // Full Name field to display full name for alignment forum users
  fullName: {
    type: String,
    optional: true,
    canRead: ['guests'],
    canUpdate: [Users.owns, 'sunshineRegiment'],
    hidden: !['LessWrong', 'AlignmentForum'].includes(getSetting('forumType'))
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

  sunshineShowNewUserContent: {
    type: Boolean,
    optional: true,
    defaultValue: false,
    canRead: ['guests'],
    group: formGroups.adminOptions,
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
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
  // TODO: Remove this after april fools
  blockedGPT2: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
    hidden: getSetting('forumType') !== 'LessWrong',
    label: "Auto-collapse comments from GPT2"
  },
  
  partiallyReadSequences: {
    type: Array,
    canRead: [Users.owns],
    canUpdate: [Users.owns],
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
    canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
    tooltip: "Get early access to new in-development features",
    label: "Opt into beta features"
  },
  // ReCaptcha v3 Integration
  // From 0 to 1. Lower is spammier, higher is humaner.
  signUpReCaptchaRating: {
    type: Number,
    optional: true,
    canRead: [Users.owns, 'sunshineRegiment', 'admins']
  },
  // Unique user slug for URLs, copied over from Vulcan-Accounts
  slug: {
    type: String,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['admins'],
    group: formGroups.adminOptions,
    order: 40,
    onInsert: user => {
      // create a basic slug from display name and then modify it if this slugs already exists;
      const displayName = createDisplayName(user);
      const basicSlug = Utils.slugify(displayName);
      return Utils.getUnusedSlugByCollectionName('Users', basicSlug, true);
    },
    onUpdate: async ({data, document}) => {
      //Make sure to update this callback for Apollo2 upgrade
      if (data.slug && data.slug !== document.slug) {
        const slugIsUsed = await Utils.slugIsUsed("Users", data.slug)
        if (slugIsUsed) {
          throw Error(`Specified slug is already used: ${data.slug}`)
        }
      }
    }
  },
  oldSlugs: {
    type: Array,
    optional: true,
    canRead: ['guests'],
    onUpdate: ({data, document}) => {
      // Make sure to update this callback for Apollo2 upgrade
      if (data.slug && data.slug !== document.slug)  {
        return [...(document.oldSlugs || []), document.slug]
      }
    }
  },
  'oldSlugs.$': {
    type: String,
    optional: true,
    canRead: ['guests'],
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
    insertableBy: [Users.owns, 'sunshineRegiment', 'admins']
  },
  hidden: true,
  deactivateNewCallback: true, // Fix to avoid triggering the editable operations on incomplete users during creation
}

makeEditable({
  collection: Users,
  options: makeEditableOptionsModeration
})

addUniversalFields({collection: Users})

// Copied over utility function from Vulcan
const createDisplayName = user => {
  const profileName = Utils.getNestedProperty(user, 'profile.name');
  const twitterName = Utils.getNestedProperty(user, 'services.twitter.screenName');
  const linkedinFirstName = Utils.getNestedProperty(user, 'services.linkedin.firstName');
  if (profileName) return profileName;
  if (twitterName) return twitterName;
  if (linkedinFirstName) return `${linkedinFirstName} ${Utils.getNestedProperty(user, 'services.linkedin.lastName')}`;
  if (user.username) return user.username;
  if (user.email) return user.email.slice(0, user.email.indexOf('@'));
  return undefined;
}
