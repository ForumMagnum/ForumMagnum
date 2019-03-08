import { Comments } from "../../../collections/comments";
import { generateIdResolverSingle, generateIdResolverMulti, addFieldsDict } from '../../../modules/utils/schemaUtils'
import { getSetting } from 'meteor/vulcan:core'
import { schemaDefaultValue } from '../../../collectionUtils';

export const alignmentOptionsGroup = {
  order: 50,
  name: "alignment",
  label: "Alignment Options",
  startCollapsed: true
};

const alignmentForum = getSetting('AlignmentForum', false)

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

  afDate: {
    type: Date,
    optional: true,
    hidden: true,
    defaultValue: false,
    viewableBy: ['guests'],
    insertableBy: ['alignmentForum'],
    editableBy: ['alignmentForum'],
  },

  afBaseScore: {
    type: Number,
    optional: true,
    label: "Alignment Base Score",
    viewableBy: ['guests'],
  },

  suggestForAlignmentUserIds: {
    type: Array,
    viewableBy: ['members'],
    editableBy: ['alignmentForum', 'alignmentForumAdmins'],
    optional: true,
    label: "Suggested for Alignment by",
    control: "UsersListEditor",
    group: alignmentOptionsGroup,
    resolveAs: {
      fieldName: 'suggestForAlignmentUsers',
      type: '[User]',
      resolver: generateIdResolverMulti(
        {collectionName: 'Users', fieldName: 'suggestForAlignmentUserIds'}
      ),
      addOriginalField: true
    },
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
    label: "AF Review UserId"
  },

  afDate: {
    order:10,
    type: Date,
    optional: true,
    label: "Alignment Forum",
    defaultValue: false,
    hidden: true,
    viewableBy: ['guests'],
    editableBy: ['alignmentForum', 'alignmentForumAdmins', 'admins'],
    insertableBy: ['alignmentForum', 'alignmentForumAdmins', 'admins'],
    group: alignmentOptionsGroup,
  },

  moveToAlignmentUserId: {
    type: String,
    optional: true,
    hidden: true,
    viewableBy: ['guests'],
    editableBy: ['alignmentForum', 'alignmentForumAdmins', 'admins'],
    group: alignmentOptionsGroup,
    label: "Move to Alignment UserId",
    resolveAs: {
      fieldName: 'moveToAlignmentUser',
      type: 'User',
      resolver: generateIdResolverSingle(
        {collectionName: 'Users', fieldName: 'moveToAlignmentUserId'}
      ),
      addOriginalField: true
    },
  },
})
