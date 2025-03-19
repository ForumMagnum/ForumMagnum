import SimpleSchema from 'simpl-schema';
import { schemaDefaultValue, arrayOfForeignKeysField, denormalizedField, googleLocationToMongoLocation } from '../../utils/schemaUtils'
import { localGroupTypeFormOptions } from './groupTypes';
import { isEAForum, isLW } from '../../instanceSettings';
import { isFriendlyUI, preferredHeadingCase } from '../../../themes/forumTheme';
import { editableFields } from '@/lib/editor/make_editable';
import { universalFields } from "../../collectionUtils";

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

const formGroups = {
  advancedOptions: {
    name: "advancedOptions",
    order: 2,
    label: isFriendlyUI ? "Advanced options" : "Advanced Options",
    startCollapsed: true,
  },
} satisfies Partial<Record<string, FormGroupType<"Localgroups">>>;

const schema: SchemaType<"Localgroups"> = {
  ...universalFields({}),
  ...editableFields("Localgroups", {
    commentEditor: true,
    commentStyles: true,
    order: 25,
    permissions: {
      canRead: ['guests'],
      canUpdate: ['members'],
      canCreate: ['members']
    },
    hintText: () => "Short description"
  }),
  
  name: {
    type: String,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    order: 10,
    control: "MuiTextField",
    label: isFriendlyUI ? "Group name" : "Group Name"
  },
  
  nameInAnotherLanguage: {
    type: String,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    order: 11,
    control: "MuiTextField",
    tooltip: 'Useful for multilingual groups - this will help people find your group in search',
    label: "Group name in another language (optional)",
    optional: true,
  },

  organizerIds: {
    ...arrayOfForeignKeysField({
      idFieldName: "organizerIds",
      resolverName: "organizers",
      collectionName: "Users",
      type: "User"
    }),
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    order: 20,
    control: "FormUserMultiselect",
    label: preferredHeadingCase("Add Organizers"),
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
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    onCreate: () => new Date(),
    hidden: true,
  },

  types: {
    type: Array,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    control: 'MultiSelectButtons',
    label: "Group Type:",
    ...schemaDefaultValue(["LW"]),
    minCount: 1, // Ensure that at least one type is selected
    form: {
      options: () => localGroupTypeFormOptions
    },
    hidden: !isLW,
  },

  'types.$': {
    type: String,
    optional: true,
  },
  
  categories: {
    type: Array,
    optional: true,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    control: 'FormComponentMultiSelect',
    placeholder: 'Select all that apply',
    form: {
      label: "Group type / intended audience",
      options: () => GROUP_CATEGORIES
    },
    hidden: !isEAForum,
  },
  
  'categories.$': {
    type: String,
    optional: true,
  },
  
  isOnline: {
    type: Boolean,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    label: "This is an online group",
    optional: true,
    ...schemaDefaultValue(false),
  },

  mongoLocation: {
    type: Object,
    canRead: ['guests'],
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
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    label: isFriendlyUI ? "Group location" : "Group Location",
    control: 'LocationFormComponent',
    blackbox: true,
    hidden: data => !!data.document?.isOnline,
    optional: true,
  },

  location: {
    type: String,
    canRead: ['guests'],
    canUpdate: ['members'],
    canCreate: ['members'],
    hidden: true,
    optional: true,
  },

  contactInfo: {
    type: String,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    label: isFriendlyUI ? "Contact info" : "Contact Info",
    control: "MuiTextField",
    optional: true,
  },

  facebookLink: { // FB Group link
    type: String,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    label: isFriendlyUI ? "Facebook group" : "Facebook Group",
    control: "MuiTextField",
    optional: true,
    regEx: SimpleSchema.RegEx.Url,
    tooltip: 'https://www.facebook.com/groups/...'
  },
  
  facebookPageLink: {
    type: String,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    label: isFriendlyUI ? "Facebook page" : "Facebook Page",
    control: "MuiTextField",
    optional: true,
    regEx: SimpleSchema.RegEx.Url,
    tooltip: 'https://www.facebook.com/...'
  },
  
  meetupLink: {
    type: String,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    label: isFriendlyUI ? "Meetup.com group" : "Meetup.com Group",
    control: "MuiTextField",
    optional: true,
    regEx: SimpleSchema.RegEx.Url,
    tooltip: 'https://www.meetup.com/...'
  },
  
  slackLink: {
    type: String,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    label: isFriendlyUI ? "Slack workspace" : "Slack Workspace",
    control: "MuiTextField",
    optional: true,
    regEx: SimpleSchema.RegEx.Url,
    tooltip: 'https://...'
  },

  website: {
    type: String,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    control: "MuiTextField",
    optional: true,
    regEx: SimpleSchema.RegEx.Url,
    tooltip: 'https://...'
  },
  
  // Cloudinary image id for the banner image (high resolution)
  bannerImageId: {
    type: String,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['members'],
    canCreate: ['members'],
    label: isFriendlyUI ? "Banner image" : "Banner Image",
    control: "ImageUpload",
    tooltip: "Recommend 1640x856 px, 1.91:1 aspect ratio (same as Facebook)",
    form: {
      croppingAspectRatio: 1.91
    }
  },
  
  inactive: {
    type: Boolean,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    hidden: true,
    optional: true,
    ...schemaDefaultValue(false),
  },
  
  deleted: {
    type: Boolean,
    canRead: ['guests'],
    canCreate: ['admins', 'sunshineRegiment'],
    canUpdate: ['admins', 'sunshineRegiment'],
    group: () => formGroups.advancedOptions,
    optional: true,
    tooltip: "Make sure you want to delete the group - it will be completely hidden from the forum.",
    ...schemaDefaultValue(false),
  },
  
  // used by the EA Forum to associate groups with their listing in salesforce - currently only populated via script
  salesforceId: {
    type: String,
    optional: true,
    nullable: true,
    hidden: true,
  },
};

export default schema;
