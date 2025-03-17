// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { TupleSet, UnionOf } from "@/lib/utils/typeGuardUtils";
import { getFillIfMissing } from "@/lib/utils/schemaUtils";

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

const schema: Record<string, NewCollectionFieldSpecification<"PetrovDayActions">> = {
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
  actionType: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      type: "String",
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
        options: () =>
          [...ACTION_TYPES].map((key) => ({
            label: key,
            value: key,
          })),
      },
    },
  },
  data: {
    database: {
      type: "JSONB",
      nullable: true,
    },
    graphql: {
      type: "JSON",
      canRead: ["guests"],
      canCreate: ["members"],
    },
  },
  userId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canCreate: ["members"],
    },
  },
};

export default schema;
