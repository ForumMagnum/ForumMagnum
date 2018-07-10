import { Posts } from "meteor/example-forum";

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
      control: 'AlignmentCheckbox'
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

]);
