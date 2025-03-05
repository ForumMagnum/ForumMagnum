import { addUniversalFields } from '../../collectionUtils';

const schema = {
  ...addUniversalFields({}),
  name: {
    type: String,
    nullable: false
  },
  af: {
    type: Boolean,
  },
  dispatched: {
    type: Boolean,
    nullable: false
  },
  failed: {
    type: Boolean,
  },
  
  delayTime: {
    type: Date,
    nullable: false
  },
  upperBoundTime: {
    type: Date,
    nullable: false
  },
  
  key: {
    type: String,
    nullable: false
  },
  pendingEvents: {
    type: Array,
  },
  "pendingEvents.$": {
    type: String,
  },
}

export default schema;
