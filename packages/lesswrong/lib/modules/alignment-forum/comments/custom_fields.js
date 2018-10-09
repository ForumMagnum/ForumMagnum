import { Comments } from "../../../collections/comments";

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
])
