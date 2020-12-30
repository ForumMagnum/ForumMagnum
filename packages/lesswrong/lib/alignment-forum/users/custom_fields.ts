import { Users } from '../../collections/users/collection';
import { userOwns } from '../../vulcan-users/permissions';
import { formGroups } from "../../collections/users/custom_fields"
import { addFieldsDict, denormalizedCountOfReferences } from '../../utils/schemaUtils'
import { postStatuses } from '../../collections/posts/constants';

addFieldsDict(Users, {
  afKarma: {
    type: Number,
    optional: true,
    label: "Alignment Base Score",
    canRead: ['guests'],
  },

  afPostCount: {
    ...denormalizedCountOfReferences({
      fieldName: "afPostCount",
      collectionName: "Users",
      foreignCollectionName: "Posts",
      foreignTypeName: "post",
      foreignFieldName: "userId",
      filterFn: (post: DbPost) => (post.af && !post.draft && post.status===postStatuses.STATUS_APPROVED),
    }),
    canRead: ['guests'],
  },

  afCommentCount: {
    type: Number,
    optional: true,
    onInsert: (document, currentUser: DbUser) => 0,
    ...denormalizedCountOfReferences({
      fieldName: "afCommentCount",
      collectionName: "Users",
      foreignCollectionName: "Comments",
      foreignTypeName: "comment",
      foreignFieldName: "userId",
      filterFn: (comment: DbComment) => comment.af,
    }),
    canRead: ['guests'],
  },

  afSequenceCount: {
    ...denormalizedCountOfReferences({
      fieldName: "afSequenceCount",
      collectionName: "Users",
      foreignCollectionName: "Sequences",
      foreignTypeName: "sequence",
      foreignFieldName: "userId",
      filterFn: (sequence: DbSequence) => sequence.af && !sequence.draft && !sequence.isDeleted
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
      filterFn: (sequence: DbSequence) => sequence.af && sequence.draft && !sequence.isDeleted
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
    canRead: [userOwns, 'alignmentForumAdmins', 'admins'],
    canUpdate: [userOwns, 'admins'],
    hidden: true,
  },

  afSubmittedApplication: {
    type: Boolean,
    optional: true,
    canRead: [userOwns, 'alignmentForumAdmins', 'admins'],
    canUpdate: [userOwns, 'admins'],
    canCreate: ['admins'],
    hidden: true,
  }
});
