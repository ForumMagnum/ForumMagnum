import Users from "meteor/vulcan:users";
import { formGroups } from "../../../collections/users/custom_fields.js"
import { addFieldsDict } from '../../utils/schemaUtils'

addFieldsDict(Users, {
  afKarma: {
    type: Number,
    optional: true,
    label: "Alignment Base Score",
    canRead: ['guests'],
  },

  afPostCount: {
    type: Number,
    optional: true,
    canRead: ['guests'],
    onInsert: (document, currentUser) => 0,
  },

  afCommentCount: {
    type: Number,
    optional: true,
    canRead: ['guests'],
    onInsert: (document, currentUser) => 0,
  },

  afSequenceCount: {
    type: Number,
    optional: true,
    canRead: ['guests'],
    onInsert: (document, currentUser) => 0,
  },

  afSequenceDraftCount: {
    type: Number,
    optional: true,
    canRead: ['guests'],
    onInsert: (document, currentUser) => 0,
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

  groups: {
    canUpdate: ['alignmentForumAdmins', 'admins'],
  },
  'groups.$': {
    type: String,
    optional: true
  },

  afApplicationText: {
    type: String,
    optional: true,
    canRead: [Users.owns, 'alignmentForumAdmins', 'admins'],
    canUpdate: [Users.owns, 'admins'],
    hidden: true,
  },

  afSubmittedApplication: {
    type: Boolean,
    optional: true,
    canRead: [Users.owns, 'alignmentForumAdmins', 'admins'],
    canUpdate: [Users.owns, 'admins'],
    canCreate: ['admins'],
    hidden: true,
  }
});
