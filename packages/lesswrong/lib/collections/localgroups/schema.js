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
    hidden: true,
    optional: true,
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
    control: "MuiTextField",
    label: "Local Group Name"
  },

  types: {
    type: Array,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    control: 'MultiSelectButtons',
    label: "Group Type:",
    minCount: 1, // Ensure that at least one type is selected
    form: {
      options: [
        {value: "LW", color: "rgba(100, 169, 105, 0.9)", hoverColor: "rgba(100, 169, 105, 0.5)"},
        {value: "SSC", color: "rgba(100, 169, 105, 0.9)", hoverColor: "rgba(100, 169, 105, 0.5)"},
        {value: "EA", color: "rgba(100, 169, 105, 0.9)", hoverColor: "rgba(100, 169, 105, 0.5)"},
        {value: "MIRIx", color: "rgba(100, 169, 105, 0.9)", hoverColor: "rgba(100, 169, 105, 0.5)"}
        // Alternative colorization, keep around for now
        // {value: "SSC", color: "rgba(136, 172, 184, 0.9)", hoverColor: "rgba(136, 172, 184, 0.5)"},
        // {value: "EA", color: "rgba(29, 135, 156,0.5)", hoverColor: "rgba(29, 135, 156,0.5)"},
        // {value: "MIRIx", color: "rgba(225, 96, 1,0.6)", hoverColor: "rgba(225, 96, 1,0.3)"}
      ]
    },
  },

  'types.$': {
    type: String,
    optional: true,
  },

  description: {
    type: Object,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    control: 'EditorFormComponent',
    blackbox: true,
    form: {
      enableMarkDownEditor: false
    }
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

  facebookLink: {
    type: String,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    label: "Facebook group",
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

  post: {
    type: String,
    viewableBy: ['guests'],
    optional: true,
    resolveAs: {
      fieldName: 'post',
      type: "Post",
      resolver: (event, args, context) => {
        const post = context.Posts.findOne({eventId: event._id});
        return context.Users.restrictViewableFields(context.currentUser, context.Posts, post);
      }
    }
  }
};

export default schema;
