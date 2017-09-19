import Users from "meteor/vulcan:users";


Users.addField([
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
      control: 'checkbox'
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
    banned: Whether the user is banned or not. Can be set by moderators and admins.
  */

  {
    fieldName: 'banned',
    fieldSchema: {
      type: Boolean,
      optional: true,
      viewableBy: ['guests'],
      editableBy: ['sunshineRegiment', 'admins'],
      insertableBy: ['admins'],
      control: 'checkbox',
      label: 'Ban this user'
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
]);
