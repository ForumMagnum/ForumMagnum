import { Posts } from "../../../collections/posts";
import { formGroups } from "../../../collections/posts/custom_fields.js"
import { generateIdResolverMulti } from '../../../modules/utils/schemaUtils'

Posts.addField([
  {
    fieldName: 'af',
    fieldSchema: {
      order:10,
      type: Boolean,
      optional: true,
      label: "Alignment Forum",
      defaultValue: false,
      viewableBy: ['guests'],
      editableBy: ['alignmentForum'],
      insertableBy: ['alignmentForum'],
      control: 'checkbox',
      group: formGroups.options,
    }
  },

  {
    fieldName: 'afDate',
    fieldSchema: {
      order:10,
      type: Date,
      optional: true,
      label: "Alignment Forum",
      hidden: true,
      viewableBy: ['guests'],
      editableBy: ['alignmentForum'],
      insertableBy: ['alignmentForum'],
      group: formGroups.options,
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
    fieldName: 'afCommentCount',
    fieldSchema: {
      type: Number,
      optional: true,
      defaultValue: 0,
      hidden:true,
      label: "Alignment Comment Count",
      viewableBy: ['guests'],
    }
  },

  {
    fieldName: 'afLastCommentedAt',
    fieldSchema: {
      type: Date,
      optional: true,
      hidden: true,
      viewableBy: ['guests'],
      onInsert: () => {
        return new Date();
      }
    }
  },

  {
    fieldName: 'afSticky',
    fieldSchema: {
      order: 10,
      type: Boolean,
      optional: true,
      label: "Sticky (Alignment)",
      defaultValue: false,
      group: formGroups.adminOptions,
      viewableBy: ['guests'],
      editableBy: ['alignmentForumAdmins', 'admins'],
      insertableBy: ['alignmentForumAdmins', 'admins'],
      control: 'checkbox',
      onInsert: (post) => {
        if(!post.afSticky) {
          return false;
        }
      },
      onEdit: (modifier, post) => {
        if (!(modifier.$set && modifier.$set.afSticky)) {
          return false;
        }
      }
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
      group: formGroups.adminOptions,
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
      viewableBy: ['guests'],
      editableBy: ['alignmentForumAdmins', 'admins'],
      insertableBy: ['alignmentForumAdmins', 'admins'],
      group: formGroups.adminOptions,
      label: "AF Review UserId"
    }
  },

]);
