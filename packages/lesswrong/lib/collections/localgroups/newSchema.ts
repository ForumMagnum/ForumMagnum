// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import {
  googleLocationToMongoLocation,
  arrayOfForeignKeysOnCreate,
  generateIdResolverMulti,
  getDenormalizedFieldOnCreate,
  getDenormalizedFieldOnUpdate,
  getFillIfMissing,
  throwIfSetToNull
} from "../../utils/schemaUtils";
import { isFriendlyUI } from "../../../themes/forumTheme";
import { getDefaultLocalStorageIdGenerator, getDenormalizedEditableResolver, getRevisionsResolver, getVersionResolver, RevisionStorageType } from "@/lib/editor/make_editable";

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

const formGroups: Partial<Record<string, FormGroupType<"Localgroups">>> = {
  advancedOptions: {
    name: "advancedOptions",
    order: 2,
    label: isFriendlyUI ? "Advanced options" : "Advanced Options",
    startCollapsed: true,
  },
};

const hkyKyJ = (data) => "googleLocation" in data;
const hjZByE = async (localgroup) => {
  if (localgroup.googleLocation) return googleLocationToMongoLocation(localgroup.googleLocation);
  return null;
};

const schema: Record<string, NewCollectionFieldSpecification<"Localgroups">> = {
  _id: {
    database: {
      type: "VARCHAR(27)",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
    },
  },
  schemaVersion: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 1,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "Float",
      canRead: ["guests"],
      onCreate: getFillIfMissing(1),
      onUpdate: () => 1,
    },
  },
  createdAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      type: "Date",
      canRead: ["guests"],
      onCreate: () => new Date(),
    },
  },
  legacyData: {
    database: {
      type: "JSONB",
      nullable: true,
    },
    graphql: {
      type: "JSON",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  contents: {
    graphql: {
      type: "Revision",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        simpleSchema: RevisionStorageType,
      },
      resolver: getDenormalizedEditableResolver("Localgroups", "contents"),
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
      control: "EditorFormComponent",
      hidden: false,
      editableFieldOptions: {
        getLocalStorageId: getDefaultLocalStorageIdGenerator("Localgroups"),
        revisionsHaveCommitMessages: false,
      },
    },
  },
  contents_latest: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
    },
  },
  revisions: {
    graphql: {
      type: "[Revision]",
      canRead: ["guests"],
      resolver: getRevisionsResolver("revisions"),
    },
  },
  version: {
    graphql: {
      type: "String",
      canRead: ["guests"],
      resolver: getVersionResolver("version"),
    },
  },
  name: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
    },
    form: {
      order: 10,
      label: "Group name",
      control: "MuiTextField",
    },
  },
  nameInAnotherLanguage: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
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
      type: "[String]",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      onCreate: arrayOfForeignKeysOnCreate,
    },
    form: {
      order: 20,
      label: "Add organizers",
      control: "FormUserMultiselect",
    },
  },
  organizers: {
    graphql: {
      type: "[User!]!",
      canRead: ["guests"],
      resolver: generateIdResolverMulti({ collectionName: "Localgroups", fieldName: "organizerIds" }),
    },
    form: {
      hidden: true,
    },
  },
  lastActivity: {
    database: {
      type: "TIMESTAMPTZ",
      denormalized: true,
    },
    graphql: {
      type: "Date",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      onCreate: () => new Date(),
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
      type: "[String]",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(["LW"]),
      onUpdate: throwIfSetToNull,
    },
  },
  categories: {
    database: {
      type: "TEXT[]",
    },
    graphql: {
      type: "[String]",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
    },
    form: {
      form: { label: "Group type / intended audience", options: () => GROUP_CATEGORIES },
      control: "FormComponentMultiSelect",
      placeholder: "Select all that apply",
      hidden: false,
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
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
      needsUpdate: hkyKyJ,
      getValue: hjZByE,
    },
    graphql: {
      type: "JSON",
      canRead: ["guests"],
      onCreate: getDenormalizedFieldOnCreate<"Localgroups">({ getValue: hjZByE, needsUpdate: hkyKyJ }),
      onUpdate: getDenormalizedFieldOnUpdate<"Localgroups">({ getValue: hjZByE, needsUpdate: hkyKyJ }),
    },
  },
  googleLocation: {
    database: {
      type: "JSONB",
    },
    graphql: {
      type: "JSON",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
    },
    form: {
      form: { stringVersionFieldName: "location" },
      label: "Group location",
      control: "LocationFormComponent",
      hidden: (data) => !!data.document?.isOnline,
    },
  },
  location: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
    },
  },
  contactInfo: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
    },
    form: {
      label: "Contact info",
      control: "MuiTextField",
    },
  },
  facebookLink: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        regEx: {},
      },
    },
    form: {
      label: "Facebook group",
      tooltip: "https://www.facebook.com/groups/...",
      control: "MuiTextField",
    },
  },
  facebookPageLink: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        regEx: {},
      },
    },
    form: {
      label: "Facebook page",
      tooltip: "https://www.facebook.com/...",
      control: "MuiTextField",
    },
  },
  meetupLink: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        regEx: {},
      },
    },
    form: {
      label: "Meetup.com group",
      tooltip: "https://www.meetup.com/...",
      control: "MuiTextField",
    },
  },
  slackLink: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        regEx: {},
      },
    },
    form: {
      label: "Slack workspace",
      tooltip: "https://...",
      control: "MuiTextField",
    },
  },
  website: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        regEx: {},
      },
    },
    form: {
      tooltip: "https://...",
      control: "MuiTextField",
    },
  },
  bannerImageId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
    },
    form: {
      form: { croppingAspectRatio: 1.91 },
      label: "Banner image",
      tooltip: "Recommend 1640x856 px, 1.91:1 aspect ratio (same as Facebook)",
      control: "ImageUpload",
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
    form: {
      tooltip: "Make sure you want to delete the group - it will be completely hidden from the forum.",
      group: () => formGroups.advancedOptions,
    },
  },
  salesforceId: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      type: "String",
    },
  },
};

export default schema;
