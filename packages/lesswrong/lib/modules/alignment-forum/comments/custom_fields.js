import { Comments } from "../../../collections/comments";
import { moderationOptionsGroup } from "../../../collections/posts/custom_fields.js"
import { generateIdResolverSingle, generateIdResolverMulti } from '../../../modules/utils/schemaUtils'

Comments.addField([
  {
    fieldName: 'af',
    fieldSchema: {
      type: Boolean,
      optional: true,
      label: "Alignment Forum",
      defaultValue: false,
      viewableBy: ['guests'],
      editableBy: ['alignmentForum', 'alignmentVoters', 'admins'],
      insertableBy: ['alignmentForum', 'alignmentVoters', 'admins'],
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
        insertableBy: ['sunshineRegiment', 'admins'],
        editableBy: ['alignmentForum', 'alignmentForumAdmins'],
        optional: true,
        label: "Suggested for Alignment by",
        control: "UsersListEditor",
        group: moderationOptionsGroup,
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
        group: moderationOptionsGroup,
        viewableBy: ['guests'],
        editableBy: ['alignmentForumAdmins', 'admins'],
        insertableBy: ['alignmentForumAdmins', 'admins'],
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
          group: moderationOptionsGroup,
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
          insertableBy: ['alignmentForum', 'alignmentForumAdmins', 'admins'],
          group: moderationOptionsGroup,
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
