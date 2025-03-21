// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.


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
  },
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
