import Users from "meteor/vulcan:users";
import { formGroups } from "../../../collections/users/custom_fields.js"
import { addFieldsDict, denormalizedCountOfReferences } from '../../utils/schemaUtils'

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
    ...denormalizedCountOfReferences({
      fieldName: "afSequenceCount",
      collectionName: "Users",
      foreignCollectionName: "Sequences",
      foreignTypeName: "sequence",
      foreignFieldName: "userId",
      filterFn: sequence => sequence.af && !sequence.draft && !sequence.isDeleted
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
      filterFn: sequence => sequence.af && sequence.draft && !sequence.isDeleted
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
