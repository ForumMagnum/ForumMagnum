/*

A SimpleSchema-compatible JSON schema

*/


const schema = {
  _id: {
    optional: true,
    type: String,
    viewableBy: ['members'],
  },
  createdAt: {
    optional: true,
    type: Date,
    viewableBy: ['members'],
    onInsert: (document) => {
      return new Date();
    }
  },
  title: {
    type: String,
    viewableBy: ['members'],
    editableBy: ['members'],
    insertableBy: ['members'],
    optional: true,
    label: "Conversation Title"
  },
  participantIds: {
    type: Array,
    viewableBy: ['members'],
    insertableBy: ['members'],
    editableBy: ['members'],
    optional: true,
    control: "UsersListEditor",
    label: "Participants",
    resolveAs: {
      fieldName: 'participants',
      type: '[User]',
      resolver: (conversation, args, context) => {
        const participants = _.map(conversation.participantIds, participantId =>
          {return context.Users.findOne(
            { _id: participantId },
            { fields: context.Users.getViewableFields(context.currentUser, context.Users) }
          )}
        )
        return {results: participants}
      },
      addOriginalField: true
    }
  },

  'participantIds.$': {
    type: String,
    optional: true,
  },
  latestActivity: {
    type: Date,
    viewableBy: ['members'],
    onInsert: (document) => {
      return new Date(); // if this is an insert, set createdAt to current timestamp
    },
    optional: true,
  }
};

export default schema;
