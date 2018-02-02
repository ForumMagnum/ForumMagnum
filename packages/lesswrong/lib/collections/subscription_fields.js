import Users from "meteor/vulcan:users";
import {Posts, Comments, Categories} from "meteor/example-forum"

Users.addField([
  {
    fieldName: 'subscribedItems',
    fieldSchema: {
      type: Object,
      optional: true,
      blackbox: true,
      hidden: true, // never show this
      viewableBy: ['guests'],
      editableBy: ['members'],
    }
  },
  {
    fieldName: 'subscribers',
    fieldSchema: {
      type: Array,
      optional: true,
      hidden: true, // never show this,
      viewableBy: ['guests'],
      editableBy: ['members'],
    }
  },
  {
    fieldName: 'subscribers.$',
    fieldSchema: {
      type: String,
      optional: true,
      hidden: true, // never show this,
    }
  },
  {
    fieldName: 'subscriberCount',
    fieldSchema: {
      type: Number,
      optional: true,
      hidden: true, // never show this
      viewableBy: ['guests'],
    }
  }
]);

Posts.addField([
  {
    fieldName: 'subscribers',
    fieldSchema: {
      type: Array,
      optional: true,
      hidden: true, // never show this
      viewableBy: ['guests']
    }
  },
  {
    fieldName: 'subscribers.$',
    fieldSchema: {
      type: String,
      optional: true,
      hidden: true, // never show this
    }
  },
  {
    fieldName: 'subscriberCount',
    fieldSchema: {
      type: Number,
      optional: true,
      hidden: true, // never show this
      viewableBy: ['guests']
    }
  }
]);

Comments.addField([
  {
    fieldName: 'subscribers',
    fieldSchema: {
      type: Array,
      optional: true,
      hidden: true, // never show this
      viewableBy: ['guests']
    }
  },
  {
    fieldName: 'subscribers.$',
    fieldSchema: {
      type: String,
      optional: true,
      hidden: true, // never show this
    }
  },
  {
    fieldName: 'subscriberCount',
    fieldSchema: {
      type: Number,
      optional: true,
      hidden: true, // never show this
      viewableBy: ['guests']
    }
  }
]);

Categories.addField([
  {
    fieldName: 'subscribers',
    fieldSchema: {
      type: Array,
      optional: true,
      hidden: true, // never show this
      viewableBy: ['guests']
    }
  },
  {
    fieldName: 'subscribers',
    fieldSchema: {
      type: String,
      optional: true,
      hidden: true, // never show this
    }
  },
  {
    fieldName: 'subscriberCount',
    fieldSchema: {
      type: Number,
      optional: true,
      hidden: true, // never show this
      viewableBy: ['guests']
    }
  }
]);
