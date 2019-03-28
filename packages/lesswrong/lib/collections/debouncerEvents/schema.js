
const schema = {
  _id: {
    type: String,
  },
  
  name: {
    type: String,
  },
  dispatched: {
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