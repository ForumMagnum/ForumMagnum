import { Comments } from "../../collections/comments";
import { schemaDefaultValue } from '../../collectionUtils';
import { forumTypeSetting } from "../../instanceSettings";
import { addFieldsDict, arrayOfForeignKeysField, foreignKeyField } from '../../utils/schemaUtils';
import GraphQLJSON from 'graphql-type-json';

export const alignmentOptionsGroup = {
  order: 50,
  name: "alignment",
  label: "Alignment Options",
  startCollapsed: true
};

const alignmentForum = forumTypeSetting.get() === 'AlignmentForum'

addFieldsDict(Comments, {
  af: {
    type: Boolean,
    optional: true,
    label: "AI Alignment Forum",
    ...schemaDefaultValue(false),
    viewableBy: ['guests'],
    editableBy: ['alignmentForum', 'admins'],
    insertableBy: ['alignmentForum', 'admins'],
    hidden: (props) => alignmentForum || !props.alignmentForumPost
  },

  afBaseScore: {
    type: Number,
    optional: true,
    label: "Alignment Base Score",
    viewableBy: ['guests'],
  },
  afExtendedScore: {
    type: GraphQLJSON,
    optional: true,
    viewableBy: ['guests'],
  },

  suggestForAlignmentUserIds: {
    ...arrayOfForeignKeysField({
      idFieldName: "suggestForAlignmentUserIds",
      resolverName: "suggestForAlignmentUsers",
      collectionName: "Users",
      type: "User"
    }),
    viewableBy: ['members'],
    editableBy: ['members', 'alignmentForum', 'alignmentForumAdmins'],
    optional: true,
    label: "Suggested for Alignment by",
    control: "UsersListEditor",
    group: alignmentOptionsGroup,
    hidden: true
  },
  'suggestForAlignmentUserIds.$': {
    type: String,
    optional: true
  },

  reviewForAlignmentUserId: {
    type: String,
    optional: true,
    group: alignmentOptionsGroup,
    viewableBy: ['guests'],
    editableBy: ['alignmentForumAdmins', 'admins'],
    label: "AF Review UserId",
    hidden: forumTypeSetting.get() === 'EAForum'
  },

  afDate: {
    order:10,
    type: Date,
    optional: true,
    label: "Alignment Forum",
    hidden: true,
    viewableBy: ['guests'],
    editableBy: ['alignmentForum', 'alignmentForumAdmins', 'admins'],
    insertableBy: ['alignmentForum', 'alignmentForumAdmins', 'admins'],
    group: alignmentOptionsGroup,
  },

  moveToAlignmentUserId: {
    ...foreignKeyField({
      idFieldName: "moveToAlignmentUserId",
      resolverName: "moveToAlignmentUser",
      collectionName: "Users",
      type: "User",
    }),
    optional: true,
    hidden: true,
    viewableBy: ['guests'],
    editableBy: ['alignmentForum', 'alignmentForumAdmins', 'admins'],
    group: alignmentOptionsGroup,
    label: "Move to Alignment UserId",
  },
})
