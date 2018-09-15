import Sequences from '../../../collections/sequences/collection.js';

Sequences.addField([
  // This commment will appear in alignment forum view
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
