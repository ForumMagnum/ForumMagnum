import Users from "meteor/vulcan:users";
import { Posts } from "./posts"
import { Comments } from "./comments"
import { addFieldsDict } from '../modules/utils/schemaUtils'

addFieldsDict(Users, {
  subscribedItems: {
    type: Object,
    optional: true,
    blackbox: true,
    hidden: true, // never show this
    viewableBy: ['guests'],
    editableBy: ['members'],
  },
  subscribers: {
    type: Array,
    optional: true,
    hidden: true, // never show this,
    viewableBy: ['guests'],
    editableBy: ['members'],
  },
  'subscribers.$': {
    type: String,
    optional: true,
    hidden: true, // never show this,
  },
  subscriberCount: {
    type: Number,
    optional: true,
    hidden: true, // never show this
    viewableBy: ['guests'],
  }
});

addFieldsDict(Posts, {
  subscribers: {
    type: Array,
    optional: true,
    hidden: true, // never show this
    viewableBy: ['guests']
  },
  'subscribers.$': {
    type: String,
    optional: true,
    hidden: true, // never show this
  },
  subscriberCount: {
    type: Number,
    optional: true,
    hidden: true, // never show this
    viewableBy: ['guests']
  }
});

addFieldsDict(Comments, {
  subscribers: {
    type: Array,
    optional: true,
    hidden: true, // never show this
    viewableBy: ['guests']
  },
  'subscribers.$': {
    type: String,
    optional: true,
    hidden: true, // never show this
  },
  subscriberCount: {
    type: Number,
    optional: true,
    hidden: true, // never show this
    viewableBy: ['guests']
  }
});
