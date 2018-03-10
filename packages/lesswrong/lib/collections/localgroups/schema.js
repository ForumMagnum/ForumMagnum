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

  type: {
    type: String,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    control: 'select',
    form: {
      label: "Group Type",
      options: function () { // options for the select form control
        return [
          {value: "LW", label: "LessWrong Group"},
          {value: "SSC", label: "SlateStarCodex Group"},
          {value: "EA", label: "Effective Altruism Group"},
          {value: "other", label: "Other"},
        ];
      }
    },
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

  facebookGroup: {
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
