import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LATEST_REVISION_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import SimpleSchema from "simpl-schema";
import {
  googleLocationToMongoLocation,
  arrayOfForeignKeysOnCreate,
  generateIdResolverMulti,
  getDenormalizedFieldOnCreate,
  getDenormalizedFieldOnUpdate
} from "../../utils/schemaUtils";
import { localGroupTypeFormOptions } from "./groupTypes";
import { isFriendlyUI, preferredHeadingCase } from "../../../themes/forumTheme";
import { getDefaultLocalStorageIdGenerator, getDenormalizedEditableResolver } from "@/lib/editor/make_editable";
import { RevisionStorageType } from '@/lib/collections/revisions/revisionConstants';
import { isEAForum, isLW } from "@/lib/instanceSettings";

export const GROUP_CATEGORIES = [
  { value: "national", label: "National" },
  { value: "regional", label: "Regional" },
  { value: "city", label: "City" },
  { value: "university", label: "University" },
  { value: "high-school", label: "High School" },
  { value: "workplace", label: "Workplace" },
  { value: "professional", label: "Professional" },
  { value: "cause-area", label: "Cause Area" },
  { value: "affiliation", label: "Affiliation" },
];

const formGroups = {
  advancedOptions: {
    name: "advancedOptions",
    order: 2,
    label: isFriendlyUI ? "Advanced options" : "Advanced Options",
    startCollapsed: true,
  },
} satisfies Partial<Record<string, FormGroupType<"Localgroups">>>;

function groupHasGoogleLocation(data: Partial<DbLocalgroup> | UpdateLocalgroupDataInput) {
  return "googleLocation" in data;
}

function convertGoogleToMongoLocation(localgroup: DbLocalgroup) {
  if (localgroup.googleLocation) return googleLocationToMongoLocation(localgroup.googleLocation);
  return null;
}

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  contents: {
    database: {
      type: "JSONB",
      nullable: true,
      logChanges: false,
      typescriptType: "EditableFieldContents",
    },
    graphql: {
      outputType: "Revision",
      inputType: "CreateRevisionDataInput",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      editableFieldOptions: { pingbacks: false, normalized: false },
      arguments: "version: String",
      resolver: getDenormalizedEditableResolver("Localgroups", "contents"),
      validation: {
        simpleSchema: RevisionStorageType,
        optional: true,
      },
    },
    form: {
      form: {
        hintText: () => "Short description",
        fieldName: "contents",
        collectionName: "Localgroups",
        commentEditor: true,
        commentStyles: true,
        hideControls: false,
      },
      order: 25,
      // control: "EditorFormComponent",
      hidden: false,
      editableFieldOptions: {
        getLocalStorageId: getDefaultLocalStorageIdGenerator("Localgroups"),
        revisionsHaveCommitMessages: false,
      },
    },
  },
  contents_latest: DEFAULT_LATEST_REVISION_ID_FIELD,
  name: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
    },
    form: {
      order: 10,
      label: isFriendlyUI ? "Group name" : "Group Name",
      control: "MuiTextField",
    },
  },
  nameInAnotherLanguage: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 11,
      label: "Group name in another language (optional)",
      tooltip: "Useful for multilingual groups - this will help people find your group in search",
      control: "MuiTextField",
    },
  },
  organizerIds: {
    database: {
      type: "VARCHAR(27)[]",
      defaultValue: [],
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "[String!]!",
      inputType: "[String!]!",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      onCreate: arrayOfForeignKeysOnCreate,
    },
    form: {
      order: 20,
      label: preferredHeadingCase("Add Organizers"),
      control: "FormUserMultiselect",
    },
  },
  organizers: {
    graphql: {
      outputType: "[User!]!",
      canRead: ["guests"],
      resolver: generateIdResolverMulti({ foreignCollectionName: "Users", fieldName: "organizerIds" }),
    },
  },
  lastActivity: {
    database: {
      type: "TIMESTAMPTZ",
      denormalized: true,
      nullable: false,
    },
    graphql: {
      outputType: "Date!",
      inputType: "Date",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      onCreate: () => new Date(),
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  types: {
    database: {
      type: "TEXT[]",
      defaultValue: ["LW"],
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "[String!]!",
      inputType: "[String!]!",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
    },
    form: {
      minCount: 1, // Ensure that at least one type is selected
      form: { options: () => localGroupTypeFormOptions },
      label: "Group Type:",
      // control: "MultiSelectButtons",
      hidden: () => !isLW,
    },
  },
  categories: {
    database: {
      type: "TEXT[]",
    },
    graphql: {
      outputType: "[String!]",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      form: { label: "Group type / intended audience", options: () => GROUP_CATEGORIES },
      control: "FormComponentMultiSelect",
      placeholder: "Select all that apply",
      hidden: () => !isEAForum,
    },
  },
  isOnline: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean!",
      inputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "This is an online group",
    },
  },
  mongoLocation: {
    database: {
      type: "JSONB",
      denormalized: true,
      canAutoDenormalize: true,
      needsUpdate: groupHasGoogleLocation,
      getValue: convertGoogleToMongoLocation,
    },
    graphql: {
      outputType: "JSON",
      canRead: ["guests"],
      onCreate: getDenormalizedFieldOnCreate<"Localgroups">({ getValue: convertGoogleToMongoLocation, needsUpdate: groupHasGoogleLocation }),
      onUpdate: getDenormalizedFieldOnUpdate<"Localgroups">({ getValue: convertGoogleToMongoLocation, needsUpdate: groupHasGoogleLocation }),
      validation: {
        optional: true,
        blackbox: true,
      },
    },
  },
  googleLocation: {
    database: {
      type: "JSONB",
    },
    graphql: {
      outputType: "JSON",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        optional: true,
        blackbox: true,
      },
    },
    form: {
      form: { stringVersionFieldName: "location" },
      label: isFriendlyUI ? "Group location" : "Group Location",
      // control: "LocationFormComponent",
      hidden: (data) => !!data.document?.isOnline,
    },
  },
  location: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  contactInfo: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: isFriendlyUI ? "Contact info" : "Contact Info",
      control: "MuiTextField",
    },
  },
  facebookLink: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        regEx: SimpleSchema.RegEx.Url,
        optional: true,
      },
    },
    form: {
      label: isFriendlyUI ? "Facebook group" : "Facebook Group",
      tooltip: "https://www.facebook.com/groups/...",
      control: "MuiTextField",
    },
  },
  facebookPageLink: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        regEx: SimpleSchema.RegEx.Url,
        optional: true,
      },
    },
    form: {
      label: isFriendlyUI ? "Facebook page" : "Facebook Page",
      tooltip: "https://www.facebook.com/...",
      control: "MuiTextField",
    },
  },
  meetupLink: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        regEx: SimpleSchema.RegEx.Url,
        optional: true,
      },
    },
    form: {
      label: isFriendlyUI ? "Meetup.com group" : "Meetup.com Group",
      tooltip: "https://www.meetup.com/...",
      control: "MuiTextField",
    },
  },
  slackLink: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        regEx: SimpleSchema.RegEx.Url,
        optional: true,
      },
    },
    form: {
      label: isFriendlyUI ? "Slack workspace" : "Slack Workspace",
      tooltip: "https://...",
      control: "MuiTextField",
    },
  },
  website: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        regEx: SimpleSchema.RegEx.Url,
        optional: true,
      },
    },
    form: {
      tooltip: "https://...",
      control: "MuiTextField",
    },
  },
  // Cloudinary image id for the banner image (high resolution)
  bannerImageId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      form: { croppingAspectRatio: 1.91 },
      label: isFriendlyUI ? "Banner image" : "Banner Image",
      tooltip: "Recommend 1640x856 px, 1.91:1 aspect ratio (same as Facebook)",
      // control: "ImageUpload",
    },
  },
  inactive: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean!",
      inputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  deleted: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean!",
      inputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      tooltip: "Make sure you want to delete the group - it will be completely hidden from the forum.",
      group: () => formGroups.advancedOptions,
    },
  },
  // used by the EA Forum to associate groups with their listing in salesforce - currently only populated via script
  salesforceId: {
    database: {
      type: "TEXT",
      nullable: true,
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"Localgroups">>;

export default schema;
