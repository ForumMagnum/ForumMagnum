// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { generateIdResolverSingle } from "../../utils/schemaUtils";
import { userOwns } from "../../vulcan-users/permissions";
import { validateCompareState, validateVote } from "./helpers";

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
      },
    },
  },
  electionName: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
    },
  },
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
    },
  },
  user: {
    graphql: {
      outputType: "User!",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Users", fieldName: "userId" }),
    },
  },
  compareState: {
    database: {
      type: "JSONB",
      nullable: true,
    },
    graphql: {
      outputType: "JSON",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: ({ newDocument }) =>
        validateCompareState({
          data: newDocument,
        }),
      onUpdate: ({ data }) => {
        // Throw errors but don't return anything
        validateCompareState({
          data,
        });
      },
      validation: {
        optional: true,
        blackbox: true,
      },
    },
  },
  vote: {
    database: {
      type: "JSONB",
      nullable: true,
    },
    graphql: {
      outputType: "JSON",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: ({ newDocument }) =>
        validateVote({
          data: newDocument,
        }),
      onUpdate: ({ data }) => {
        // Throw errors but don't return anything
        validateVote({
          data,
        });
      },
      validation: {
        optional: true,
        blackbox: true,
      },
    },
  },
  submittedAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onUpdate: ({ oldDocument, newDocument }) => {
        if (oldDocument.submittedAt?.toISOString() !== newDocument.submittedAt?.toISOString()) {
          // To avoid timezone issues, set submittedAt to the server time on edit
          return newDocument.submittedAt ? new Date() : null;
        }
        return oldDocument.submittedAt;
      },
      validation: {
        optional: true,
      },
    },
  },
  submissionComments: {
    database: {
      type: "JSONB",
      nullable: true,
    },
    graphql: {
      outputType: "JSON",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
        blackbox: true,
      },
    },
  },
  userExplanation: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
  },
  userOtherComments: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"ElectionVotes">>;

export default schema;
