import Users from "meteor/vulcan:users";
import { getSetting } from "meteor/vulcan:core"
import { generateIdResolverSingle } from '../../modules/utils/schemaUtils'

export const formGroups = {
  moderationGroup: {
    order:60,
    name: "moderation",
    label: "Moderation",
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

Users.addField([

  {
    fieldName: 'createdAt',
    fieldSchema: {
      type: Date,
      onInsert: (user, options) => {
        return user.createdAt || new Date();
      }
    }
  },

  // LESSWRONG: Overwrite Vulcan locale field to be hidden by default
  {
    fieldName: 'locale',
    fieldSchema: {
        hidden: true,
        canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
    }
  },

  /**
    Emails (not to be confused with email). This field belongs to Meteor's
    accounts system; we should never write it, but we do need to read it to find
    out whether a user's email address is verified.
  */
  {
    fieldName: 'emails',
    fieldSchema: {
      hidden: true,
      canRead: [Users.owns, 'sunshineRegiment', 'admins'],
    }
  },
  {
    fieldName: 'emails.$',
    fieldSchema: {
      type: Object,
    }
  },

  /**
  */
  {
    fieldName: 'whenConfirmationEmailSent',
    fieldSchema: {
      type: Date,
      optional: true,
      order: 1,
      group: formGroups.emails,
      control: 'UsersEmailVerification',
      canRead: ['members'],
      canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
      canCreate: ['members'],
    }
  },

  /**
    Legacy: Boolean used to indicate that post was imported from old LW database
  */
  {
    fieldName: 'legacy',
    fieldSchema: {
      type: Boolean,
      optional: true,
      defaultValue: false,
      hidden: true,
      canRead: ['guests'],
      canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
      canCreate: ['members'],
    }
  },

  {
    fieldName: 'commentSorting',
    fieldSchema: {
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
    }
  },

  /**
    Intercom: Will the user display the intercom while logged in?
  */
  {
    fieldName: 'hideIntercom',
    fieldSchema: {
      order: 70,
      type: Boolean,
      optional: true,
      defaultValue: false,
      canRead: ['guests'],
      canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
      canCreate: ['members'],
      control: 'checkbox',
      label: "Hide Intercom"
    }
  },

  {
    /*
      This field-name is no longer accurate, but is here because we used to have that field
      around and then removed `markDownCommentEditor` and merged it into this field.
    */
    fieldName: 'markDownPostEditor',
    fieldSchema: {
      order: 70,
      type: Boolean,
      optional: true,
      defaultValue: false,
      canRead: ['guests'],
      canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
      canCreate: ['members'],
      control: 'checkbox',
      label: "Activate Markdown Editor"
    }
  },

  {
    fieldName: 'email',
    fieldSchema: {
      order: 20,
      canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
    }
  },
  {
    fieldName: 'currentFrontpageFilter',
    fieldSchema: {
      type: String,
      optional: true,
      canRead: Users.owns,
      canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
      canCreate: Users.owns,
      hidden: true,
    }
  },
  {
    fieldName: 'lastNotificationsCheck',
    fieldSchema: {
      type: Date,
      optional: true,
      canRead: Users.owns,
      canUpdate: Users.owns,
      canCreate: Users.owns,
      hidden: true,
    }
  },
  {
    fieldName: 'website',
    fieldSchema: {
      regEx: null,
      order: 30,
    }
  },

  /**
    Bio (Markdown version)
  */
  {
    fieldName: 'bio',
    fieldSchema: {
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
    }
  },

  /**
    Bio (Markdown version)
  */
  {
    fieldName: 'htmlBio',
    fieldSchema: {
      type: String,
      optional: true,
      canRead: ['guests'],
    }
  },

  /**
    Karma field
  */
  {
    fieldName: 'karma',
    fieldSchema: {
      type: Number,
      optional: true,
      canRead: ['guests'],
    }
  },

  /**
    Website
  */
  {
    fieldName: 'website',
    fieldSchema: {
      type: String,
      hidden: true,
      optional: true,
      control: "text",
      canCreate: ['members'],
      canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
      canRead: ['guests'],
      order: 50,
    }
  },

  {
    fieldName: 'moderationStyle',
    fieldSchema: {
      type: String,
      optional: true,
      control: "select",
      group: formGroups.moderationGroup,
      label: "Style",
      canRead: ['guests'],
      canUpdate: [Users.ownsAndInGroup('trustLevel1'), 'sunshineRegiment', 'admins'],
      canCreate: [Users.ownsAndInGroup('trustLevel1'), 'sunshineRegiment', 'admins'],
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
    }
  },

  {
    fieldName: 'moderationGuidelines',
    fieldSchema: {
      type: String,
      optional: true,
      group: formGroups.moderationGroup,
      label: "Special Guidelines",
      placeholder: "Any particular norms or guidelines that you like to cultivate in your comment sections? (If you are specific, LW moderates can help enforce this)",
      canRead: ['guests'],
      canUpdate: [Users.ownsAndInGroup('trustLevel1'), 'sunshineRegiment', 'admins'],
      canCreate: [Users.ownsAndInGroup('trustLevel1'), 'sunshineRegiment', 'admins'],
      control: 'MuiTextField',
      blackbox: true,
      order: 55,
      form: {
        hintText:"Bio",
        rows:4,
        multiLine:true,
        fullWidth:true,
      },
    }
  },

  {
    fieldName: 'moderatorAssistance',
    fieldSchema: {
      type: Boolean,
      optional: true,
      group: formGroups.moderationGroup,
      label: "I'm happy for LW site moderators to help enforce my policy",
      canRead: ['guests'],
      canUpdate: [Users.ownsAndInGroup('trustLevel1'), 'sunshineRegiment', 'admins'],
      canCreate: [Users.ownsAndInGroup('trustLevel1'), 'sunshineRegiment', 'admins'],
      control: 'checkbox',
      blackbox: true,
      order: 55,
    }
  },

  {
    fieldName: 'twitterUsername',
    fieldSchema: {
      hidden: true,
      canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
    }
  },

  /**
    bannedUserIds: users who are not allowed to comment on this user's posts
  */

  {
    fieldName: 'bannedUserIds',
    fieldSchema: {
      type: Array,
      group: formGroups.moderationGroup,
      canRead: ['guests'],
      canUpdate: [Users.ownsAndInGroup('trustLevel1'), 'sunshineRegiment', 'admins'],
      canCreate: [Users.ownsAndInGroup('trustLevel1'), 'sunshineRegiment', 'admins'],
      optional: true,
      label: "Banned Users",
      control: 'UsersListEditor'
    }
  },
  {
    fieldName: 'bannedUserIds.$',
    fieldSchema: {
      type: String,
      optional: true
    }
  },

  /**
    Legacy ID: ID used in the original LessWrong database
  */
  {
    fieldName: 'legacyId',
    fieldSchema: {
      type: String,
      hidden: true,
      optional: true,
      canRead: ['guests'],
      canUpdate: ['admins'],
      canCreate: ['members'],
    }
  },

  /**
    Deleted: Boolean indicating whether user has been deleted
                (initially used in the LW database transfer )
  */
  {
    fieldName: 'deleted',
    fieldSchema: {
      type: Boolean,
      optional: true,
      defaultValue: false,
      canRead: ['guests'],
      canUpdate: ['admins'],
      canCreate: ['members'],
      label: 'Delete this user',
      control: 'checkbox',
      hidden: true,
    }
  },

  /**
    legacyData: A complete dump of all the legacy data we have on this post in a
    single blackbox object. Never queried on the client, but useful for a lot
    of backend functionality, and simplifies the data import from the legacy
    LessWrong database
  */

  {
    fieldName: 'legacyData',
    fieldSchema: {
      type: Object,
      optional: true,
      canRead: ['admins'],
      canCreate: ['admins'],
      canUpdate: ['admins'],
      hidden: true,
      blackbox: true,
    }
  },

  /**
    algoliaIndexAt: Last time the record was indexed by algolia. Undefined if it hasn't yet been indexed.
  */

  {
    fieldName: 'algoliaIndexAt',
    fieldSchema: {
      type: Date,
      optional: true,
      canRead: ['guests']
    }
  },

  /**
    voteBanned: All future votes of this user have weight 0
  */

  {
    fieldName: 'voteBanned',
    fieldSchema: {
      type: Boolean,
      optional: true,
      canRead: ['guests'],
      canUpdate: ['sunshineRegiment', 'admins'],
      canCreate: ['admins'],
      control: 'checkbox',
      group: formGroups.banUser,
      label: 'Set all future votes of this user to have zero weight'
    }
  },

  /**
    nullifyVotes: Set all historical votes of this user to 0, and make any future votes have a vote weight of 0
  */

  {
    fieldName: 'nullifyVotes',
    fieldSchema: {
      type: Boolean,
      optional: true,
      canRead: ['guests'],
      canUpdate: ['sunshineRegiment', 'admins'],
      canCreate: ['admins'],
      control: 'checkbox',
      group: formGroups.banUser,
      label: 'Nullify all past votes'
    }
  },

  /**
    deleteContent: Flag all comments and posts from this user as deleted
  */

  {
    fieldName: 'deleteContent',
    fieldSchema: {
      type: Boolean,
      optional: true,
      canRead: ['guests'],
      canUpdate: ['sunshineRegiment', 'admins'],
      canCreate: ['admins'],
      control: 'checkbox',
      group: formGroups.banUser,
      label: 'Delete all user content'
    }
  },

  /**
    banned: Whether the user is banned or not. Can be set by moderators and admins.
  */

  {
    fieldName: 'banned',
    fieldSchema: {
      type: Date,
      optional: true,
      canRead: ['guests'],
      canUpdate: ['sunshineRegiment', 'admins'],
      canCreate: ['admins'],
      control: 'datetime',
      label: 'Ban user until',
      group: formGroups.banUser,
    }
  },

  /**
    IPDummy: All Ips that this user has ever logged in with
  */

  {
    fieldName: 'IPDummy',
    fieldSchema: {
      type: Array,
      optional: true,
      group: formGroups.banUser,
      canRead: ['sunshineRegiment', 'admins'],
      resolveAs: {
        fieldName: 'IPs',
        type: '[String]',
        resolver: (user, args, context) => {
          const IPs = context.LWEvents.find({userId: user._id, name: 'login'}, {fields: context.Users.getViewableFields(context.currentUser, context.LWEvents), limit: 10, sort: {createdAt: -1}}).fetch().map(event => event.properties && event.properties.ip);
          const uniqueIPs = _.uniq(IPs);
          return uniqueIPs;
        },
        addOriginalField: false,
      },
    }
  },

  {
    fieldName: 'IPDummy.$',
    fieldSchema: {
      type: String,
      optional: true,
    }
  },

  /**
    New Notifications settings
  */
  {
    fieldName: 'auto_subscribe_to_my_posts',
    fieldSchema: {
      group: formGroups.notifications,
      label: "Notifications for Comments on My Posts"
    }
  },
  {
    fieldName: 'auto_subscribe_to_my_comments',
    fieldSchema: {
      group: formGroups.notifications,
      label: "Notifications For Replies to My Comments",
    }
  },

  /**
    Email settings
  */
  {
    fieldName: 'emailSubscribedToCurated',
    fieldSchema: {
      type: Boolean,
      optional: true,
      group: formGroups.emails,
      control: 'EmailConfirmationRequiredCheckbox',
      label: "Email me new posts in Curated",
      canCreate: ['members'],
      canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
      canRead: ['members'],
    }
  },

  /**
    Hide the option to change your displayName (for now) TODO: Create proper process for changing name
  */

  {
    fieldName: 'displayName',
    fieldSchema: {
      canUpdate: ['sunshineRegiment', 'admins'],
      canCreate: ['sunshineRegiment', 'admins'],
    }
  },

  /**
    frontpagePostCount: count of how many posts of yours were posted on the frontpage
  */

  {
    fieldName: 'frontpagePostCount',
    fieldSchema: {
      type: Number,
      optional: true,
      canRead: ['guests'],
      onInsert: (document, currentUser) => 0,
    }
  },

  /**
    sequenceCount: count of how many non-draft, non-deleted sequences you have
  */

  {
    fieldName: 'sequenceCount',
    fieldSchema: {
      type: Number,
      optional: true,
      canRead: ['guests'],
      onInsert: (document, currentUser) => 0,
    }
  },

  /**
    sequenceDraftCount: count of how many draft, non-deleted sequences you have
  */

  {
    fieldName: 'sequenceDraftCount',
    fieldSchema: {
      type: Number,
      optional: true,
      canRead: ['guests'],
      onInsert: (document, currentUser) => 0,
    }
  },

  {
    fieldName: 'mongoLocation',
    fieldSchema: {
      type: Object,
      canRead: ['guests'],
      canCreate: ['members'],
      canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
      hidden: true,
      blackbox: true,
      optional: true
    }
  },

  {
    fieldName: 'googleLocation',
    fieldSchema: {
      type: Object,
      canRead: ['guests'],
      canCreate: ['members'],
      canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
      label: "Group Location",
      control: 'LocationFormComponent',
      blackbox: true,
      optional: true
    }
  },

  {
    fieldName: 'location',
    fieldSchema: {
      type: String,
      searchable: true,
      canRead: ['guests'],
      canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
      canCreate: ['members'],
      hidden: true,
      optional: true
    }
  },

  {
    fieldName: 'reviewedByUserId',
    fieldSchema: {
      type: String,
      optional: true,
      canRead: ['sunshineRegiment', 'admins'],
      canUpdate: ['sunshineRegiment', 'admins'],
      canCreate: ['sunshineRegiment', 'admins'],
      hidden: true,
      resolveAs: {
        fieldName: 'reviewedByUser',
        type: 'User',
        resolver: generateIdResolverSingle(
          {collectionName: 'Users', fieldName: 'reviewedByUserId'}
        ),
        addOriginalField: true
      },
    }
  },

  {
    fieldName: 'allVotes',
    fieldSchema: {
      type: Array,
      optional: true,
      canRead: ['admins', 'sunshineRegiment'],
      resolveAs: {
        type: '[Vote]',
        resolver: async (document, args, { Users, Votes, currentUser }) => {
          const votes = await Votes.find({ userId: document._id }).fetch();
          if (!votes.length) return [];
          return Users.restrictViewableFields(currentUser, Votes, votes);
        },
      }
    }
  },

  {
    fieldName: 'allVotes.$',
    fieldSchema: {
      type: Object,
      optional: true
    }
  },

  {
    fieldName: 'afKarma',
    fieldSchema: {
      type: Number,
      optional: true,
      label: "Alignment Base Score",
      defaultValue: false,
      canRead: ['guests'],
    }
  },

  {
    fieldName: 'voteCount',
    fieldSchema: {
      type: Number,
      optional: true,
      label: "Small Upvote Count",
      canRead: ['guests'],
    }
  },

  {
    fieldName: 'smallUpvoteCount',
    fieldSchema: {
      type: Number,
      optional: true,
      canRead: ['guests'],
    }
  },

  {
    fieldName: 'smallDownvoteCount',
    fieldSchema: {
      type: Number,
      optional: true,
      canRead: ['guests'],
    }
  },

  {
    fieldName: 'bigUpvoteCount',
    fieldSchema: {
      type: Number,
      optional: true,
      canRead: ['guests'],
    }
  },

  {
    fieldName: 'bigDownvoteCount',
    fieldSchema: {
      type: Number,
      optional: true,
      canRead: ['guests'],
    }
  },

  // Full Name field to display full name for alignment forum users
  {
    fieldName: 'fullName',
    fieldSchema: {
      type: String,
      optional: true,
      canRead: ['guests'],
      canUpdate: [Users.owns, 'sunshineRegiment']
    }
  }
]);
