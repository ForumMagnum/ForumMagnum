import { Comments } from "../../../collections/comments";
import { moderationOptionsGroup } from "../../../collections/comments/custom_fields";
import { generateIdResolverMulti } from '../../../modules/utils/schemaUtils'

Comments.addField([
  {
    fieldName: 'af',
    fieldSchema: {
      type: Boolean,
      optional: true,
      label: "Alignment Forum",
      defaultValue: false,
      viewableBy: ['guests'],
      editableBy: ['alignmentVoters'],
      insertableBy: ['alignmentVoters'],
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

])
