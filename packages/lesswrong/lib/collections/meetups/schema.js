/*

A SimpleSchema-compatible JSON schema

*/

const schema = {
  _id: {
    optional: true,
    type: String,
    viewableBy: ['guests'],
  },
  createdAt: {
    optional: true,
    type: Date,
    viewableBy: ['guests'],
    onInsert: (document) => {
      return new Date();
    }
  },
  organizerIds: {
    type: Array,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    optional: true,
    hidden: true,
    resolveAs: {
      fieldName: 'organizers',
      type: '[User]',
      resolver: (meetup, args, context) => {
        return _.map(meetup.organizerIds,
          (organizerId => {return context.Users.findOne({ _id: organizerId }, { fields: context.Users.getViewableFields(context.currentUser, context.Users) })})
        )
      },
      addOriginalField: true
    }
  },

  'organizerIds.$': {
    type: String,
    optional: true,
  },

  localGroupId: {
    type: String,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    optional: true,
    hidden: true,
    resolveAs: {
      fieldName: 'localGroup',
      type: 'LocalGroup',
      resolver: (groupId, args, context) => {
        return context.LocalGroups.findOne({ _id: groupId }, { fields: context.Users.getViewableFields(context.currentUser, context.LocalGroups) })
      },
      addOriginalField: true
    }
  },

  name: {
    type: String,
    searchable: true,
    viewableBy: ['guests'],
    editableBy: ['members'],
    insertableBy: ['members'],
  },

  description: {
    type: Object,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    control: 'EditorFormComponent',
    order: 2,
    blackbox: true,
    optional: true,
  },

  googleLocation: {
    type: Object,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    control: 'LocationFormComponent',
    blackbox: true,
  },

  location: {
    type: String,
    searchable: true,
    viewableBy: ['guests'],
    editableBy: ['members'],
    insertableBy: ['members'],
    hidden: true,
  }
};

export default schema;
