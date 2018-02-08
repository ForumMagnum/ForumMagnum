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
      resolver: (localGroup, args, context) => {
        return _.map(localGroup.organizerIds,
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

  lastActivity: {
    type: Date,
    optional: true,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    onInsert: () => new Date(),
    hidden: true,
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

  contactInfo: {
    type: String,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    optional: true,
  },

  facebookGroup: {
    type: String,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    optional: true,
  },

  website: {
    type: String,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    optional: true,
  },

  mongoLocation: {
    type: Object,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    hidden: true,
    blackbox: true,
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
