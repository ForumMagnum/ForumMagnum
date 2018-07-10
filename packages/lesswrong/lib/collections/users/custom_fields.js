import Users from "meteor/vulcan:users";

const moderationGroup = {
  order:60,
  name: "moderation",
  label: "Moderation",
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
        hidden: true
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
      viewableBy: ['guests'],
      editableBy: ['members'],
      insertableBy: ['members'],
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
      viewableBy: ['guests'],
      editableBy: ['members'],
      insertableBy: ['members'],
      control: 'checkbox',
      label: "Hide Intercom"
    }
  },

  {
    fieldName: 'markDownCommentEditor',
    fieldSchema: {
      order: 70,
      type: Boolean,
      optional: true,
      defaultValue: false,
      viewableBy: ['guests'],
      editableBy: ['members'],
      insertableBy: ['members'],
      control: 'checkbox',
      label: "Markdown Comment Editor"
    }
  },

  {
    fieldName: 'markDownPostEditor',
    fieldSchema: {
      order: 70,
      type: Boolean,
      optional: true,
      defaultValue: false,
      viewableBy: ['guests'],
      editableBy: ['members'],
      insertableBy: ['members'],
      control: 'checkbox',
      label: "Markdown Post Editor"
    }
  },

  {
    fieldName: 'email',
    fieldSchema: {
      order: 20,
    }
  },
  {
    fieldName: 'currentFrontpageFilter',
    fieldSchema: {
      type: String,
      optional: true,
      viewableBy: Users.owns,
      editableBy: Users.owns,
      insertableBy: Users.owns,
      hidden: true,
    }
  },
  {
    fieldName: 'lastNotificationsCheck',
    fieldSchema: {
      type: Date,
      optional: true,
      viewableBy: Users.owns,
      editableBy: Users.owns,
      insertableBy: Users.owns,
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
      control: "textarea",
      insertableBy: ['members'],
      editableBy: ['members'],
      viewableBy: ['guests'],
      order: 40,
      searchable: true
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
      viewableBy: ['guests'],
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
      viewableBy: ['guests'],
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
      insertableBy: ['members'],
      editableBy: ['members'],
      viewableBy: ['guests'],
      order: 50,
    }
  },

  {
    fieldName: 'moderationStyle',
    fieldSchema: {
      type: String,
      optional: true,
      control: "select",
      group: moderationGroup,
      label: "Style",
      viewableBy: ['guests'],
      editableBy: ['trustLevel1', 'admins'],
      insertableBy: ['trustLevel1', 'admins'],
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
      group: moderationGroup,
      label: "Special Guidelines",
      placeholder: "Any particular norms or guidelines that you like to cultivate in your comment sections? (If you are specific, LW moderates can help enforce this)",
      viewableBy: ['guests'],
      editableBy: ['trustLevel1'],
      insertableBy: ['trustLevel1'],
      control: 'textarea',
      blackbox: true,
      order: 55,
    }
  },

  {
    fieldName: 'moderatorAssistance',
    fieldSchema: {
      type: Boolean,
      optional: true,
      group: moderationGroup,
      label: "I'm happy for LW site moderators to help enforce my policy",
      viewableBy: ['guests'],
      editableBy: ['trustLevel1'],
      insertableBy: ['trustLevel1'],
      control: 'checkbox',
      blackbox: true,
      order: 55,
    }
  },

  {
    fieldName: 'twitterUsername',
    fieldSchema: {
      hidden: true,
    }
  },

  /**
    bannedUserIds: users who are not allowed to comment on this user's posts
  */

  {
    fieldName: 'bannedUserIds',
    fieldSchema: {
      type: Array,
      group: moderationGroup,
      viewableBy: ['members'],
      editableBy: ['trustLevel1'],
      insertableBy: ['trustLevel1'],
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
      viewableBy: ['guests'],
      editableBy: ['admins'],
      insertableBy: ['members'],
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
      viewableBy: ['guests'],
      editableBy: ['admins'],
      insertableBy: ['members'],
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
      viewableBy: ['admins'],
      insertableBy: ['admins'],
      editableBy: ['admins'],
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
      viewableBy: ['guests']
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
      viewableBy: ['guests'],
      editableBy: ['sunshineRegiment', 'admins'],
      insertableBy: ['admins'],
      control: 'checkbox',
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
      viewableBy: ['guests'],
      editableBy: ['sunshineRegiment', 'admins'],
      insertableBy: ['admins'],
      control: 'checkbox',
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
      viewableBy: ['guests'],
      editableBy: ['sunshineRegiment', 'admins'],
      insertableBy: ['admins'],
      control: 'checkbox',
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
      viewableBy: ['guests'],
      editableBy: ['sunshineRegiment', 'admins'],
      insertableBy: ['admins'],
      control: 'datetime',
      label: 'Ban this user until'
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
      viewableBy: ['sunshineRegiment', 'admins'],
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
    Overwrite newsletter subscribe field to be hidden (for now) TODO: Get newsletter to run properly
  */

  {
    fieldName: 'newsletter_subscribeToNewsletter',
    fieldSchema: {
      hidden: true,
    }
  },

  /**
    Overwrite email notification settings to be hidden (for now) TODO: Get email notifications to run properly
  */
  {
    fieldName: 'notifications_comments',
    fieldSchema: {
      hidden: true,
    }
  },
  {
    fieldName: 'notifications_replies',
    fieldSchema: {
      hidden: true,
    }
  },

  /**
    New Notifications settings
  */
  {
    fieldName: 'auto_subscribe_to_my_posts',
    fieldSchema: {
      group: null,
      label: "Notifications for Comments on My Posts"
    }
  },
  {
    fieldName: 'auto_subscribe_to_my_comments',
    fieldSchema: {
      group: null,
      label: "Notifications For Replies to My Comments"
    }
  },
  {
    fieldName: 'notifications_posts',
    fieldSchema: {
      group: null
    }
  },
  /**
    Hide the option to change your displayName (for now) TODO: Create proper process for changing name
  */

  {
    fieldName: 'displayName',
    fieldSchema: {
      editableBy: ['sunshineRegiment', 'admins'],
      insertableBy: ['sunshineRegiment', 'admins'],
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
      viewableBy: ['guests'],
      editableBy: ['admins'],
      insertableBy: ['admins'],
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
      viewableBy: ['guests'],
      editableBy: ['admins'],
      insertableBy: ['admins'],
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
      viewableBy: ['guests'],
      editableBy: ['admins'],
      insertableBy: ['admins'],
      onInsert: (document, currentUser) => 0,
    }
  },

  {
    fieldName: 'mongoLocation',
    fieldSchema: {
      type: Object,
      viewableBy: ['guests'],
      insertableBy: ['members'],
      editableBy: ['members'],
      hidden: true,
      blackbox: true,
      optional: true
    }
  },

  {
    fieldName: 'googleLocation',
    fieldSchema: {
      type: Object,
      viewableBy: ['guests'],
      insertableBy: ['members'],
      editableBy: ['members'],
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
      viewableBy: ['guests'],
      editableBy: ['members'],
      insertableBy: ['members'],
      hidden: true,
      optional: true
    }
  },

  {
    fieldName: 'reviewedByUserId',
    fieldSchema: {
      type: String,
      optional: true,
      viewableBy: ['sunshineRegiment', 'admins'],
      editableBy: ['sunshineRegiment', 'admins'],
      insertableBy: ['sunshineRegiment', 'admins'],
      hidden: true,
      resolveAs: {
        fieldName: 'reviewedByUser',
        type: 'User',
        resolver: async (user, args, context) => {
          if (!user.reviewedByUserId) return null;
          const reviewUser = await context.Users.loader.load(user.reviewedByUserId);
          return context.Users.restrictViewableFields(context.currentUser, context.Users, reviewUser);
        },
        addOriginalField: true
      },
    }
  },

  {
    fieldName: 'allVotes',
    fieldSchema: {
      type: Array,
      optional: true,
      viewableBy: ['admins', 'sunshineRegiment'],
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
      viewableBy: ['guests'],
    }
  },
]);
