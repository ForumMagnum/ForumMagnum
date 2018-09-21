import Sequences from '../../../collections/sequences/collection.js';

Sequences.addField([
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
  }
])
