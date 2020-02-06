import Sequences from '../../collections/sequences/collection';
import { addFieldsDict } from '../../utils/schemaUtils'

addFieldsDict(Sequences, {
  af: {
    type: Boolean,
    optional: true,
    label: "Alignment Forum",
    defaultValue: false,
    viewableBy: ['guests'],
    editableBy: ['alignmentVoters'],
    insertableBy: ['alignmentVoters'],
  }
})
