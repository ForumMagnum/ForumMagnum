// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { defaultEditorPlaceholder, getDefaultLocalStorageIdGenerator, getDenormalizedEditableResolver, getRevisionsResolver, getVersionResolver, RevisionStorageType } from "@/lib/editor/make_editable";
import { generateIdResolverSingle } from "@/lib/utils/schemaUtils";
import { documentIsNotDeleted, userOwns } from "@/lib/vulcan-users/permissions";
import moment from "moment";

function generateCode(length: number) {
  let result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export const eventTypes = [
  {
    value: "public",
    label: "Displayed on the public Garden Calendar",
  },
  {
    value: "private",
    label: "Displayed only to you",
  },
];

const schema = {
  _id: {
    database: {
      type: "VARCHAR(27)",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
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
      outputType: "Float",
      canRead: ["guests"],
      onUpdate: () => 1,
      validation: {
        optional: true,
      },
    },
  },
  createdAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      onCreate: () => new Date(),
      validation: {
        optional: true,
      },
    },
  },
  legacyData: {
    database: {
      type: "JSONB",
      nullable: true,
    },
    graphql: {
      outputType: "JSON",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
        blackbox: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  contents: {
    database: {
      type: "JSONB",
      nullable: true,
      logChanges: false,
      typescriptType: "EditableFieldContents",
    },
    graphql: {
      outputType: "Revision",
      canRead: [documentIsNotDeleted],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      editableFieldOptions: { pingbacks: true, normalized: false },
      arguments: "version: String",
      resolver: getDenormalizedEditableResolver("GardenCodes", "contents"),
      validation: {
        simpleSchema: RevisionStorageType,
        optional: true,
      },
    },
    form: {
      form: {
        hintText: () => defaultEditorPlaceholder,
        fieldName: "contents",
        collectionName: "GardenCodes",
        commentEditor: true,
        commentStyles: true,
        hideControls: true,
      },
      order: 20,
      control: "EditorFormComponent",
      hidden: false,
      editableFieldOptions: {
        getLocalStorageId: getDefaultLocalStorageIdGenerator("GardenCodes"),
        revisionsHaveCommitMessages: false,
      },
    },
  },
  contents_latest: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  revisions: {
    graphql: {
      outputType: "[Revision]",
      canRead: ["guests"],
      arguments: "limit: Int = 5",
      resolver: getRevisionsResolver("revisions"),
    },
  },
  version: {
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      resolver: getVersionResolver("version"),
    },
  },
  pingbacks: {
    database: {
      type: "JSONB",
      denormalized: true,
    },
    graphql: {
      outputType: "JSON",
      canRead: "guests",
      validation: {
        optional: true,
      },
    },
  },
  slug: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      slugCallbackOptions: {
        collectionsToAvoidCollisionsWith: ["GardenCodes"],
        getTitle: (gc) => gc.title,
        onCollision: "newDocumentGetsSuffix",
        includesOldSlugs: false,
      },
      validation: {
        optional: true,
      },
    },
  },
  code: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      onCreate: () => {
        return generateCode(4);
      },
      validation: {
        optional: true,
      },
    },
  },
  title: {
    database: {
      type: "TEXT",
      defaultValue: "Guest Day Pass",
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
    },
    form: {
      order: 10,
      label: "Event Name",
    },
  },
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      onCreate: ({ currentUser }) => currentUser?._id,
      validation: {
        optional: true,
      },
    },
  },
  user: {
    graphql: {
      outputType: "User",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Users", fieldName: "userId" }),
    },
  },
  startTime: {
    database: {
      type: "TIMESTAMPTZ",
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: () => new Date(),
      validation: {
        optional: true,
      },
    },
    form: {
      order: 20,
      label: "Start Time",
      control: "datetime",
    },
  },
  endTime: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      canUpdate: ["admins"],
      onCreate: ({ document: gardenCode }) => {
        return moment(gardenCode.startTime).add(12, "hours").toDate();
      },
      validation: {
        optional: true,
      },
    },
    form: {
      order: 25,
      label: "End Time",
      control: "datetime",
    },
  },
  fbLink: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 25,
      label: "FB Event Link",
    },
  },
  type: {
    database: {
      type: "TEXT",
      defaultValue: "public",
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      form: { options: () => eventTypes },
      order: 30,
      label: "Event Visibility:",
      control: "radiogroup",
    },
  },
  hidden: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 32,
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
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 35,
    },
  },
  afOnly: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["alignmentForum"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 36,
      label: "Limit attendance to AI Alignment Forum members",
      control: "checkbox",
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"GardenCodes">>;

export default schema;
