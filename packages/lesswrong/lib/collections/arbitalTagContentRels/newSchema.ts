// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  parentDocumentId: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
      canCreate: ["admins"],
    },
  },
  childDocumentId: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
      canCreate: ["admins"],
    },
  },
  parentCollectionName: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
      canCreate: ["admins"],
      validation: {
        allowedValues: ["Tags", "MultiDocuments"],
      },
    },
  },
  childCollectionName: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
      canCreate: ["admins"],
      validation: {
        allowedValues: ["Tags", "MultiDocuments"],
      },
    },
  },
  // From Arbital schema comment
  // Type of the relationship.
  // parent: parentId is a parent of childId
  // tag: parentId is a tag of childId
  // requirement: parentId is a requirement of childId
  // subject: parentId is a subject that childId teaches
  // Easy way to memorize: {parentId} is {childId}'s {type}
  // Other way to memorize: for each of the relationships you can add
  // on the relationship tab of the edit page, the page you're editing
  // is the child.
  type: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
      canCreate: ["admins"],
      validation: {
        allowedValues: [
          "parent-taught-by-child",
          "parent-is-requirement-of-child",
          "parent-is-tag-of-child",
          "parent-is-parent-of-child",
        ],
      },
    },
  },
  level: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      inputType: "Float!",
      canRead: ["guests"],
      canCreate: ["admins"],
    },
  },
  isStrong: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      inputType: "Boolean!",
      canRead: ["guests"],
      canCreate: ["admins"],
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"ArbitalTagContentRels">>;

export default schema;
