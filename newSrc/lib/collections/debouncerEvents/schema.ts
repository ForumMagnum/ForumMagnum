
const schema = {
  name: {
    type: String,
  },
  af: {
    type: Boolean,
  },
  dispatched: {
    type: Boolean,
  },
  failed: {
    type: Boolean,
  },
  
  delayTime: {
    type: Date,
  },
  upperBoundTime: {
    type: Date,
  },
  
  key: {
    type: String,
  },
  pendingEvents: {
    type: Array,
  },
  "pendingEvents.$": {
    type: Object,
    blackbox: true,
  },
}

export default schema;
