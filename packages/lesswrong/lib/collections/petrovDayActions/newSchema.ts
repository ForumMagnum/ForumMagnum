// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { TupleSet, UnionOf } from "@/lib/utils/typeGuardUtils";

const ACTION_TYPES = [
  "optIn",
  "hasRole",
  "hasSide",
  "nukeTheWest",
  "nukeTheEast",
  "eastPetrovAllClear",
  "eastPetrovNukesIncoming",
  "westPetrovAllClear",
  "westPetrovNukesIncoming",
] as const;

const ACTION_TYPES_SET = new TupleSet(ACTION_TYPES);
export type PetrovDayActionType = UnionOf<typeof ACTION_TYPES_SET>;

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
  // NOTE: this whole schema is bad, sorry Robert
  actionType: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
      canCreate: ["members"],
      validation: {
        allowedValues: [
          "optIn",
          "hasRole",
          "hasSide",
          "nukeTheWest",
          "nukeTheEast",
          "eastPetrovAllClear",
          "eastPetrovNukesIncoming",
          "westPetrovAllClear",
          "westPetrovNukesIncoming",
        ],
      },
    },
    form: {
      form: {
        options: () => [...ACTION_TYPES].map((key) => ({ label: key, value: key })),
      },
    },
  },
  data: {
    database: {
      type: "JSONB",
      nullable: true,
    },
    graphql: {
      outputType: "JSON",
      canRead: ["guests"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
  },
  userId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
      canCreate: ["members"],
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"PetrovDayActions">>;

export default schema;
