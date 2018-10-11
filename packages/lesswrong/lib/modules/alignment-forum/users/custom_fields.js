import Users from "meteor/vulcan:users";
import { formGroups } from "../../../collections/users/custom_fields.js"

Users.addField([
  {
    fieldName: 'afKarma',
    fieldSchema: {
      type: Number,
      optional: true,
      label: "Alignment Base Score",
      viewableBy: ['guests'],
    }
  },

  {
    fieldName: 'afPostCount',
    fieldSchema: {
      type: Number,
      optional: true,
      viewableBy: ['guests'],
      onInsert: (document, currentUser) => 0,
    }
  },

  {
    fieldName: 'afCommentCount',
    fieldSchema: {
      type: Number,
      optional: true,
      viewableBy: ['guests'],
      onInsert: (document, currentUser) => 0,
    }
  },

  {
    fieldName: 'afSequenceCount',
    fieldSchema: {
      type: Number,
      optional: true,
      viewableBy: ['guests'],
      onInsert: (document, currentUser) => 0,
    }
  },

  {
    fieldName: 'afSequenceDraftCount',
    fieldSchema: {
      type: Number,
      optional: true,
      viewableBy: ['guests'],
      onInsert: (document, currentUser) => 0,
    }
  },

  {
    fieldName: 'reviewForAlignmentFormUserId',
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
