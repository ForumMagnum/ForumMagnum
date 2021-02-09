import { arrayOfForeignKeysField, denormalizedField, googleLocationToMongoLocation } from '../../utils/schemaUtils'
import { localGroupTypeFormOptions } from './groupTypes';
import { schemaDefaultValue } from '../../collectionUtils';

const schema: SchemaType<DbLocalgroup> = {
  createdAt: {
    optional: true,
    type: Date,
    viewableBy: ['guests'],
    onInsert: (document) => new Date(),
  },

  name: {
    type: String,
    viewableBy: ['guests'],
    editableBy: ['members'],
    order:10,
    insertableBy: ['members'],
    control: "MuiInput",
    label: "Local Group Name"
  },

  organizerIds: {
    ...arrayOfForeignKeysField({
      idFieldName: "organizerIds",
      resolverName: "organizers",
      collectionName: "Users",
      type: "User"
    }),
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    order:20,
    control: "UsersListEditor",
    label: "Add Organizers",
  },

  'organizerIds.$': {
    type: String,
    foreignKey: "Users",
    optional: true,
  },

  lastActivity: {
    type: Date,
    denormalized: true,
    optional: true,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    onInsert: () => new Date(),
    hidden: true,
  },

  types: {
    type: Array,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    control: 'MultiSelectButtons',
    label: "Group Type:",
    defaultValue: ["LW"],
    minCount: 1, // Ensure that at least one type is selected
    form: {
      options: localGroupTypeFormOptions
    },
  },

  'types.$': {
    type: String,
    optional: true,
  },

  mongoLocation: {
    type: Object,
    viewableBy: ['guests'],
    hidden: true,
    blackbox: true,
    ...denormalizedField({
      needsUpdate: data => ('googleLocation' in data),
      getValue: async (localgroup) => {
        if (localgroup.googleLocation) return googleLocationToMongoLocation(localgroup.googleLocation)
      }
    }),
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
    control: "MuiInput",
    optional: true,
  },

  facebookLink: {
    type: String,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    label: "Facebook group",
    control: "MuiInput",
    optional: true,
  },

  website: {
    type: String,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    control: "MuiInput",
    optional: true,
  },

  inactive: {
    type: Boolean,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    hidden: true,
    optional: true,
    ...schemaDefaultValue(false),
  }
};

export default schema;
