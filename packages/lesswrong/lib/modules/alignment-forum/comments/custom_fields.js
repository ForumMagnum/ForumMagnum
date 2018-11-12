import { Comments } from "../../../collections/comments";
import { generateIdResolverSingle, generateIdResolverMulti } from '../../../modules/utils/schemaUtils'

export const alignmentOptionsGroup = {
  order: 50,
  name: "alignment",
  label: "Alignment Options",
  startCollapsed: true
};


Comments.addField([
  {
    fieldName: 'af',
    fieldSchema: {
      type: Boolean,
      optional: true,
      label: "AI Alignment Forum",
      defaultValue: false,
      viewableBy: ['guests'],
      editableBy: ['alignmentForum', 'admins'],
      insertableBy: ['alignmentForum', 'admins'],
    }
  },

  {
    fieldName: 'afDate',
    fieldSchema: {
      type: Date,
      optional: true,
      hidden: true,
      defaultValue: false,
      viewableBy: ['guests'],
      insertableBy: ['alignmentForum'],
      editableBy: ['alignmentForum'],
    }
  },

  {
    fieldName: 'afBaseScore',
    fieldSchema: {
      type: Number,
      optional: true,
      label: "Alignment Base Score",
      viewableBy: ['guests'],
    }
  },


    {
      fieldName: 'suggestForAlignmentUserIds',
      fieldSchema: {
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
      }
    },

    {
      fieldName: 'suggestForAlignmentUserIds.$',
      fieldSchema: {
        type: String,
        optional: true
      }
    },

    {
      fieldName: 'reviewForAlignmentUserId',
      fieldSchema: {
        type: String,
        optional: true,
        group: alignmentOptionsGroup,
        viewableBy: ['guests'],
        editableBy: ['alignmentForumAdmins', 'admins'],
        label: "AF Review UserId"
      }
    },

      {
        fieldName: 'afDate',
        fieldSchema: {
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
        }
      },

      {
        fieldName: 'moveToAlignmentUserId',
        fieldSchema: {
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
        }
      },
])
