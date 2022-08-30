import { Comments } from "./collection";
import { userOwns } from '../../vulcan-users/permissions';
import { makeEditable } from '../../editor/make_editable'
import { foreignKeyField, addFieldsDict } from '../../utils/schemaUtils'
import { schemaDefaultValue } from '../../collectionUtils';

export const moderationOptionsGroup: FormGroup = {
  order: 50,
  name: "moderation",
  label: "Moderator Options",
  startCollapsed: true
};

addFieldsDict(Comments, {
  // Legacy: Boolean used to indicate that post was imported from old LW database
  legacy: {
    type: Boolean,
    optional: true,
    hidden: true,
    ...schemaDefaultValue(false),
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
  },

  // Legacy ID: ID used in the original LessWrong database
  legacyId: {
    type: String,
    hidden: true,
    optional: true,
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
  },

  // Legacy Poll: Boolean to indicate that original LW data had a poll here
  legacyPoll: {
    type: Boolean,
    optional: true,
    hidden: true,
    defaultValue: false,
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
  },

  // Legacy Parent Id: Id of parent comment in original LW database
  legacyParentId: {
    type: String,
    hidden: true,
    optional: true,
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
  },

  // retracted: Indicates whether a comment has been retracted by its author.
  // Results in the text of the comment being struck-through, but still readable.
  retracted: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    control: "checkbox",
    hidden: true,
    ...schemaDefaultValue(false),
  },

  // deleted: Indicates whether a comment has been deleted by an admin.
  // Deleted comments and their replies are not rendered by default.
  deleted: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    control: "checkbox",
    hidden: true,
    ...schemaDefaultValue(false),
  },

  deletedPublic: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    hidden: true,
    ...schemaDefaultValue(false),
  },

  deletedReason: {
    type: String,
    optional: true,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    hidden: true,
  },

  deletedDate: {
    type: Date,
    optional: true,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['sunshineRegiment', 'admins'],
    onEdit: (modifier, document, currentUser) => {
      if (modifier.$set && (modifier.$set.deletedPublic || modifier.$set.deleted)) {
        return new Date()
      }
    },
    hidden: true,
  },

  deletedByUserId: {
    ...foreignKeyField({
      idFieldName: "deletedByUserId",
      resolverName: "deletedByUser",
      collectionName: "Users",
      type: "User",
      nullable: true,
    }),
    optional: true,
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['members'],
    hidden: true,
    onEdit: (modifier, document, currentUser) => {
      if (modifier.$set && (modifier.$set.deletedPublic || modifier.$set.deleted) && currentUser) {
        return modifier.$set.deletedByUserId || currentUser._id
      }
    },
  },

  // spam: Indicates whether a comment has been marked as spam.
  // This removes the content of the comment, but still renders replies.
  spam: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins'],
    control: "checkbox",
    hidden: true,
    ...schemaDefaultValue(false),
  },

  // repliesBlockedUntil: Deactivates replying to this post by anyone except
  // admins and sunshineRegiment members until the specified time is reached.
  repliesBlockedUntil: {
    type: Date,
    optional: true,
    group: moderationOptionsGroup,
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
    control: 'datetime'
  },

  needsReview: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    hidden: true,
  },

  reviewedByUserId: {
    ...foreignKeyField({
      idFieldName: "reviewedByUserId",
      resolverName: "reviewedByUser",
      collectionName: "Users",
      type: "User",
      nullable: true,
    }),
    optional: true,
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    hidden: true,
  },

  // hideAuthor: Displays the author as '[deleted]'. We use this to copy over
  // old deleted comments from LW 1.0
  hideAuthor: {
    type: Boolean,
    group: moderationOptionsGroup,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['admins'],
    ...schemaDefaultValue(false),
  },
  
  moderatorHat: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    ...schemaDefaultValue(false),
    hidden: true,
  },

  // whether this comment is pinned on the author's profile
  isPinnedOnProfile: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    hidden: true,
    ...schemaDefaultValue(false),
  }
});

makeEditable({
  collection: Comments,
  options: {
    // Determines whether to use the comment editor configuration (e.g. Toolbars)
    commentEditor: true,
    // Determines whether to use the comment editor styles (e.g. Fonts)
    commentStyles: true,
    // Sets the algorithm for determing what storage ids to use for local storage management
    getLocalStorageId: (comment, name) => {
      if (comment._id) { return {id: comment._id, verify: true} }
      if (comment.parentCommentId) { return {id: ('parent:' + comment.parentCommentId), verify: false}}
      return {id: ('post:' + comment.postId), verify: false}
    },
    order: 25
  }
})

