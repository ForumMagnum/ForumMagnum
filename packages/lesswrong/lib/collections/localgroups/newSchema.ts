import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LATEST_REVISION_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import SimpleSchema from "simpl-schema";
import {
  googleLocationToMongoLocation,
  arrayOfForeignKeysOnCreate,
  generateIdResolverMulti,
  getDenormalizedFieldOnCreate,
  getDenormalizedFieldOnUpdate
} from "../../utils/schemaUtils";
import { getDenormalizedEditableResolver } from "@/lib/editor/make_editable";
import { RevisionStorageType } from '@/lib/collections/revisions/revisionConstants';

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
