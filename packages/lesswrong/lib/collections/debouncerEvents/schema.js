
const schema = {
  _id: {
    optional: true,
    type: String,
    viewableBy: ['members'],
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
  },
}

export default schema;