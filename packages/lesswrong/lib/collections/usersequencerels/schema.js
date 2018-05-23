/*

A SimpleSchema-compatible JSON schema

*/

//define schema
const schema = {
  _id: {
    optional: true,
    type: String,
    viewableBy: ['guests'],
  },
  createdAt: {
    type: Date,
    optional: true,
    onInsert: (document, currentUser) => {
      return new Date();
    },
    viewableBy: ['members'],
  },
  userId: {
    type: String,
    viewableBy: ['members'],
    insertableBy: ['admins'],
    resolveAs: {
      fieldName: 'user',
      type: 'User',
      resolver: (event, args, context) => context.Users.findOne({_id: event.userId}, {fields: context.getViewableFields(context.currentUser, context.Users)}),
      addOriginalField: true,
    },
    optional: true,
  },
  sequenceId: {
    type: String,
    optional: true,
    viewableBy: ['members'],
    insertableBy: ['admins'],
    resolveAs: {
      fieldName: 'collection',
      addOriginalField: true,
      type: "Collection",
      resolver: (userSequenceRel, args, context) => {
        if (!userSequenceRel.sequenceId) return null;
        return context.Collections.findOne({_id: userSequenceRel.sequenceId})
      }
    },
  },
  lastViewedPostSlug: {
    type: String,
    optional: true,
    viewableBy: ['members'],
    insertableBy: ['admins'],
  },
  lastViewedPostTitle: {
    type: String,
    optional: true,
    viewableBy: ['members'],
    insertableBy: ['admins'],
  }
};

export default schema;
