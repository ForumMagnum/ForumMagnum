import React from 'react'
import { Components } from "meteor/vulcan:core";
import { Comments } from "meteor/example-forum";
import Users from "meteor/vulcan:users";

Comments.addField([

  {
    fieldName: 'body',
    fieldSchema: {
      type: String,
      viewableBy: ['guests'],
      insertableBy: ['members'],
      editableBy: ['members'],
      control: "textarea",
      optional: true,
      hidden: true,
      // LESSWRONG: Drastically increased original Vulcan character limit
      max: 1000000,
    }
  },

  /**
    Ory Editor content JSON
  */
  {
    fieldName: 'content',
    fieldSchema: {
      type: Object,
      optional: true,
      viewableBy: ['guests'],
      editableBy: ['members'],
      insertableBy: ['members'],
      control: 'CommentEditor',
      blackbox: true,
      order: 25,
      form: {
        hintText:"Plain Markdown Editor",
        name:"body",
        rows:4,
        multiLine:true,
        fullWidth:true,
        underlineShow:false
      },
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
      hidden: true,
      defaultValue: false,
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
      editableBy: ['members'],
      insertableBy: ['members'],
    }
  },

  /**
    Legacy Poll: Boolean to indicate that original LW data had a poll here
  */
  {
    fieldName: 'legacyPoll',
    fieldSchema: {
      type: Boolean,
      optional: true,
      hidden: true,
      defaultValue: false,
      viewableBy: ['guests'],
      editableBy: ['members'],
      insertableBy: ['members'],
    }
  },

  /**
    Legacy Parent Id: Id of parent comment in original LW database
  */
  {
    fieldName: 'legacyParentId',
    fieldSchema: {
      type: String,
      hidden: true,
      optional: true,
      viewableBy: ['guests'],
      editableBy: ['members'],
      insertableBy: ['members'],
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
    retracted: Indicates whether a comment has been retracted by its author.
    Results in the text of the comment being struck-through, but still readable.
  */

  {
    fieldName: 'retracted',
    fieldSchema: {
      type: Boolean,
      optional: true,
      viewableBy: ['guests'],
      insertableBy: Users.owns,
      editableBy: Users.owns,
      control: "checkbox",
      hidden: true,
    }
  },

  /**
    deleted: Indicates whether a comment has been deleted by an admin.
    Deleted comments and their replies are not rendered by default.
  */

  {
    fieldName: 'deleted',
    fieldSchema: {
      type: Boolean,
      optional: true,
      viewableBy: ['guests'],
      insertableBy: ['members'],
      editableBy: ['members'],
      control: "checkbox",
      hidden: true,
    }
  },

  {
    fieldName: 'deletedPublic',
    fieldSchema: {
      type: Boolean,
      optional: true,
      viewableBy: ['guests'],
      insertableBy: ['members'],
      editableBy: ['members'],
      hidden: true,
    }
  },

  {
    fieldName: 'deletedReason',
    fieldSchema: {
      type: String,
      optional: true,
      viewableBy: ['guests'],
      insertableBy: ['members'],
      editableBy: ['members'],
      hidden: true,
    }
  },

  {
    fieldName: 'deletedDate',
    fieldSchema: {
      type: Date,
      optional: true,
      viewableBy: ['guests'],
      insertableBy: ['members'],
      editableBy: ['members'],
      hidden: true,
    }
  },

  {
    fieldName: 'deletedByUserId',
    fieldSchema: {
      type: String,
      optional: true,
      viewableBy: ['guests'],
      editableBy: ['members'],
      insertableBy: ['members'],
      hidden: true,
      resolveAs: {
        fieldName: 'deletedByUser',
        type: 'User',
        resolver: async (comment, args, context) => {
          if (!comment.deletedByUserId) return null;
          const user = await context.Users.loader.load(comment.deletedByUserId);
          return context.Users.restrictViewableFields(context.currentUser, context.Users, user);
        },
        addOriginalField: true
      },
    }
  },

  /**
    spam: Indicates whether a comment has been marked as spam.
    This removes the content of the comment, but still renders replies.
  */

  {
    fieldName: 'spam',
    fieldSchema: {
      type: Boolean,
      optional: true,
      viewableBy: ['guests'],
      insertableBy: ['admins'],
      editableBy: ['admins'],
      control: "checkbox",
      hidden: true,
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
    repliesBlockedUntil: Deactivates replying to this post by anyone except admins and sunshineRegiment members until the specified time is reached.
  */

  {
    fieldName: 'repliesBlockedUntil',
    fieldSchema: {
      type: Date,
      optional: true,
      viewableBy: ['guests'],
      editableBy: ['sunshineRegiment', 'admins'],
      insertableBy: ['sunshineRegiment', 'admins'],
      control: 'datetime'
    }
  },

  {
    fieldName: 'reviewedByUserId',
    fieldSchema: {
      type: String,
      optional: true,
      viewableBy: ['guests'],
      editableBy: ['sunshineRegiment', 'admins'],
      insertableBy: ['sunshineRegiment', 'admins'],
      hidden: true,
      resolveAs: {
        fieldName: 'reviewedByUser',
        type: 'User',
        resolver: async (comment, args, context) => {
          if (!comment.reviewedByUserId) return null;
          const user = await context.Users.loader.load(comment.reviewedByUserId);
          return context.Users.restrictViewableFields(context.currentUser, context.Users, user);
        },
        addOriginalField: true
      },
    }
  },

  // This commment will appear in alignment forum view
  {
    fieldName: 'af',
    fieldSchema: {
      type: Boolean,
      optional: true,
      label: "Alignment Forum",
      defaultValue: false,
      viewableBy: ['guests'],
      editableBy: ['alignmentForum'],
      insertableBy: ['alignmentForum'],
      control: 'AlignmentCheckbox'
    }
  },

  {
    fieldName: 'afBaseScore',
    fieldSchema: {
      type: Number,
      optional: true,
      label: "Alignment Base Score",
      defaultValue: false,
      viewableBy: ['guests'],
      // editableBy: ['alignmentForum'],
      // insertableBy: ['alignmentForum'],
    }
  },

]);
