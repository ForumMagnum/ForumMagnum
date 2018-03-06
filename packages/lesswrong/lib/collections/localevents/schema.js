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
    control: "UsersListEditor",
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

  name: {
    type: String,
    searchable: true,
    viewableBy: ['guests'],
    editableBy: ['members'],
    insertableBy: ['members'],
    control: "MuiTextField",
    label: "Local Group Name"
  },

  topic: {
    type: String,
    searchable: true,
    viewableBy: ['guests'],
    editableBy: ['members'],
    insertableBy: ['members'],
    control: "MuiTextField",
    label: "Topic"
  },

  time: {
    type: Date,
    viewableBy: ['guests'],
    editableBy: ['members'],
    insertableBy: ['members'],
    label: "Time"
  },

  description: {
    type: Object,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    control: 'EditorFormComponent',
    blackbox: true,
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
    label: "Group Location",
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
  },

  contactInfo: {
    type: String,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    label: "Contact Info",
    control: "MuiTextField",
    optional: true,
  },

  facebookEvent: {
    type: String,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    label: "Facebook Event",
    control: "MuiTextField",
    optional: true,
  },

  website: {
    type: String,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    control: "MuiTextField",
    optional: true,
  },


};

export default schema;
