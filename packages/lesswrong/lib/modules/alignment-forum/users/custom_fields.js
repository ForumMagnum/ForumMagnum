import Users from "meteor/vulcan:users";
import { formGroups } from "../../../collections/users/custom_fields.js"

Users.addField([
  {
    fieldName: 'afKarma',
    fieldSchema: {
      type: Number,
      optional: true,
      label: "Alignment Base Score",
      canRead: ['guests'],
    }
  },

  {
    fieldName: 'afPostCount',
    fieldSchema: {
      type: Number,
      optional: true,
      canRead: ['guests'],
      onInsert: (document, currentUser) => 0,
    }
  },

  {
    fieldName: 'afCommentCount',
    fieldSchema: {
      type: Number,
      optional: true,
      canRead: ['guests'],
      onInsert: (document, currentUser) => 0,
    }
  },

  {
    fieldName: 'afSequenceCount',
    fieldSchema: {
      type: Number,
      optional: true,
      canRead: ['guests'],
      onInsert: (document, currentUser) => 0,
    }
  },

  {
    fieldName: 'afSequenceDraftCount',
    fieldSchema: {
      type: Number,
      optional: true,
      canRead: ['guests'],
      onInsert: (document, currentUser) => 0,
    }
  },

  {
    fieldName: 'reviewForAlignmentForumUserId',
    fieldSchema: {
      type: String,
      optional: true,
      canRead: ['guests'],
      canUpdate: ['alignmentForumAdmins', 'admins'],
      canCreate: ['alignmentForumAdmins', 'admins'],
      group: formGroups.adminOptions,
      label: "AF Review UserId"
    }
  },

  {
    fieldName: 'groups',
    fieldSchema: {
      canUpdate: ['alignmentForumAdmins', 'admins'],
    }
  },
  {
    fieldName: 'groups.$',
    fieldSchema: {
      type: String,
      optional: true
    }
  },

  {
    fieldName: 'afApplicationText',
    fieldSchema: {
      type: String,
      optional: true,
      canRead: [Users.owns, 'alignmentForumAdmins', 'admins'],
      canUpdate: [Users.owns, 'admins'],
      hidden: true,
    }
  },

  {
    fieldName: 'afSubmittedApplication',
    fieldSchema: {
      type: Boolean,
      optional: true,
      canRead: [Users.owns, 'alignmentForumAdmins', 'admins'],
      canUpdate: [Users.owns, 'admins'],
      canCreate: ['admins'],
      hidden: true,
    }
  }

]);
