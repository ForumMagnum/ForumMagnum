import SimpleSchema from 'simpl-schema';
import { arrayOfForeignKeysField, denormalizedField, googleLocationToMongoLocation } from '../../utils/schemaUtils'
import { localGroupTypeFormOptions } from './groupTypes';
import { schemaDefaultValue } from '../../collectionUtils';
import { forumTypeSetting } from '../../instanceSettings';

const isEAForum = forumTypeSetting.get() === 'EAForum';
const isLW = forumTypeSetting.get() === 'LessWrong';

export const GROUP_CATEGORIES = [
  {value: 'national', label: 'National'},
  {value: 'regional', label: 'Regional'},
  {value: 'city', label: 'City'},
  {value: 'university', label: 'University'},
  {value: 'high-school', label: 'High School'},
  {value: 'workplace', label: 'Workplace'},
  {value: 'professional', label: 'Professional'},
  {value: 'cause-area', label: 'Cause Area'},
  {value: 'affiliation', label: 'Affiliation'},
]

const formGroups: Partial<Record<string,FormGroup>> = {
  advancedOptions: {
    name: "advancedOptions",
    order: 2,
    label: "Advanced Options",
    startCollapsed: true,
  },
};

const schema: SchemaType<DbLocalgroup> = {
  name: {
    type: String,
    viewableBy: ['guests'],
    editableBy: ['members'],
    order:10,
    insertableBy: ['members'],
    control: "MuiTextField",
    label: "Group Name"
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
    hidden: isEAForum,
  },

  'types.$': {
    type: String,
    optional: true,
  },
  
  categories: {
    type: Array,
    optional: true,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    control: 'FormComponentMultiSelect',
    placeholder: 'Select all that apply',
    form: {
      label: "Group type / intended audience",
      options: GROUP_CATEGORIES
    },
    hidden: isLW,
  },
  
  'categories.$': {
    type: String,
    optional: true,
  },
  
  isOnline: {
    type: Boolean,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    label: "This is an online group",
    optional: true,
    ...schemaDefaultValue(false),
  },

  mongoLocation: {
    type: Object,
    viewableBy: ['guests'],
    hidden: true,
    optional: true,
    blackbox: true,
    ...denormalizedField({
      needsUpdate: data => ('googleLocation' in data),
      getValue: async (localgroup) => {
        if (localgroup.googleLocation) return googleLocationToMongoLocation(localgroup.googleLocation)
        return null
      }
    }),
  },

  googleLocation: {
    type: Object,
    form: {
      stringVersionFieldName: "location",
    },
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    label: "Group Location",
    control: 'LocationFormComponent',
    blackbox: true,
    hidden: data => data.document.isOnline,
    optional: true,
  },

  location: {
    type: String,
    viewableBy: ['guests'],
    editableBy: ['members'],
    insertableBy: ['members'],
    hidden: true,
    optional: true,
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

  facebookLink: { // FB Group link
    type: String,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    label: "Facebook Group",
    control: "MuiTextField",
    optional: true,
    regEx: SimpleSchema.RegEx.Url,
    tooltip: 'https://www.facebook.com/groups/...'
  },
  
  facebookPageLink: {
    type: String,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    label: "Facebook Page",
    control: "MuiTextField",
    optional: true,
    regEx: SimpleSchema.RegEx.Url,
    tooltip: 'https://www.facebook.com/...'
  },
  
  meetupLink: {
    type: String,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    label: "Meetup.com Group",
    control: "MuiTextField",
    optional: true,
    regEx: SimpleSchema.RegEx.Url,
    tooltip: 'https://www.meetup.com/...'
  },
  
  slackLink: {
    type: String,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    label: "Slack Workspace",
    control: "MuiTextField",
    optional: true,
    regEx: SimpleSchema.RegEx.Url,
    tooltip: 'https://...'
  },

  website: {
    type: String,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    control: "MuiTextField",
    optional: true,
    regEx: SimpleSchema.RegEx.Url,
    tooltip: 'https://...'
  },
  
  // Cloudinary image id for the banner image (high resolution)
  bannerImageId: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['members'],
    insertableBy: ['members'],
    label: "Banner Image",
    control: "ImageUpload",
    tooltip: "Recommend 1640x856 px, 1.91:1 aspect ratio (same as Facebook)",
    form: {
      croppingAspectRatio: 1.91
    }
  },
  
  inactive: {
    type: Boolean,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    hidden: true,
    optional: true,
    ...schemaDefaultValue(false),
  },
  
  deleted: {
    type: Boolean,
    viewableBy: ['guests'],
    insertableBy: ['admins', 'sunshineRegiment'],
    editableBy: ['admins', 'sunshineRegiment'],
    group: formGroups.advancedOptions,
    optional: true,
    tooltip: "Make sure you want to delete the group - it will be completely hidden from the forum.",
    ...schemaDefaultValue(false),
  },
};

export default schema;
