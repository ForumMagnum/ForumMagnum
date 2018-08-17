import { Posts } from "meteor/example-forum";
import { formGroups } from "../../../collections/posts/custom_fields.js"

Posts.addField([
  // This post will appear in alignment forum view
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

]);
